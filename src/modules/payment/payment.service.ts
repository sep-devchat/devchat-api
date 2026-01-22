import { BadRequestException, Injectable } from "@nestjs/common";
import { CreatePaymentRequest } from "./dto";
import { Env } from "@utils";
import { VnpayService } from "nestjs-vnpay";
import {
	dateFormat,
	VnpLocale,
	VnpCurrCode,
	ReturnQueryFromVNPay,
	ProductCode,
	consoleLogger,
} from "vnpay";
import {
	GroupRepository,
	GroupSubscriptionRepository,
	GroupEntitlementRepository,
	OrderRepository,
	ShareFundRepository,
	SubscriptionRepository,
	TransactionRepository,
	UserRepository,
} from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";

import {
	makeOrderInfo,
	normalizeIpAddr,
	parseOrderInfo,
	toVndAmountFromVnpay,
} from "./payment.helpers";
import { UserGroupRepository } from "@db/repositories";
import { In, IsNull, Not } from "typeorm";
import { compareSubscriptions } from "@utils";

@Injectable()
export class PaymentService {
	constructor(
		private readonly vnpay: VnpayService,
		private readonly cls: ClsService<DevChatCls>,
		private readonly groupRepo: GroupRepository,
		private readonly userGroupRepo: UserGroupRepository,
		private readonly shareFundRepo: ShareFundRepository,
		private readonly subscriptionRepo: SubscriptionRepository,
		private readonly groupSubscriptionRepo: GroupSubscriptionRepository,
		private readonly groupEntitlementRepo: GroupEntitlementRepository,
		private readonly transactionRepo: TransactionRepository,
		private readonly userRepo: UserRepository,
		private readonly orderRepo: OrderRepository,
	) {}

	private async addUserSubscriptionRole(
		userId: string,
		role: "CONTRIBUTION" | "SPONSOR",
	) {
		const user = await this.userRepo.findOneBy({ id: userId });
		if (!user) throw new BadRequestException("User not found");
		const currentRoles = Array.isArray(user.subscriptionRole)
			? user.subscriptionRole
			: [];
		if (currentRoles.includes(role)) return;
		await this.userRepo.update(userId, {
			subscriptionRole: [...currentRoles, role],
		});
	}

	private addMonths(from: Date, months: number) {
		const d = new Date(from);
		d.setMonth(d.getMonth() + months);
		return d;
	}

	private async ensureEntitlementSnapshot(params: {
		groupId: string;
		subscriptionId: string;
		effectiveFrom: Date;
		effectiveTo: Date | null;
		makeCurrent?: boolean;
		source:
			| "trial"
			| "purchase"
			| "renewal"
			| "change"
			| "admin_override"
			| "migration";
		createdBy: string;
	}) {
		const {
			groupId,
			subscriptionId,
			effectiveFrom,
			effectiveTo,
			makeCurrent,
			source,
			createdBy,
		} = params;

		const existing = await this.groupEntitlementRepo.findOne({
			where: {
				groupId: String(groupId),
				subscriptionId: String(subscriptionId),
				effectiveFrom,
			},
		});
		if (existing) {
			if (makeCurrent && !existing.isCurrent) {
				await this.groupEntitlementRepo.update(
					{ groupId: String(groupId), isCurrent: true },
					{ isCurrent: false },
				);
				await this.groupEntitlementRepo.update(existing.id, {
					isCurrent: true,
				});
			}
			return;
		}

		const subscription = await this.subscriptionRepo.findOneBy({
			id: String(subscriptionId),
		});
		if (!subscription) throw new BadRequestException("Subscription not found");

		if (makeCurrent) {
			await this.groupEntitlementRepo.update(
				{ groupId: String(groupId), isCurrent: true },
				{ isCurrent: false },
			);
		}

		await this.groupEntitlementRepo.insert(
			this.groupEntitlementRepo.create({
				groupId: String(groupId),
				effectiveFrom,
				effectiveTo,
				source,
				subscriptionId: String(subscriptionId),
				isCurrent: Boolean(makeCurrent),
				entitlements: {
					subscription: {
						code: subscription.subscriptionCode,
						name: subscription.subscriptionName,
					},
					features: {
						ai: Boolean(subscription.isAIActive),
					},
					limits: {
						members: Number(subscription.limitMembers ?? 0),
						runCodePerDay: Number(subscription.runCodePerDay ?? 0),
						programmingLanguagesInGroups: Number(
							subscription.programmingLanguageInGroups ?? 0,
						),
					},
				},
				createdBy: String(createdBy),
			}),
		);
	}

	private async applyGroupSubscription(params: {
		groupId: string;
		subscriptionId: string;
		monthQuantity: number;
		paymentBy: string;
		createdBy: string;
	}) {
		const { groupId, subscriptionId, monthQuantity, paymentBy, createdBy } =
			params;
		const purchasedSubscription = await this.subscriptionRepo.findOneBy({
			id: String(subscriptionId),
		});
		if (!purchasedSubscription)
			throw new BadRequestException("Subscription not found");

		const now = new Date();
		const isFreePurchased = Number(purchasedSubscription.price ?? 0) <= 0;

		// Find the current effective subscription in the group.
		const activeTiers = await this.groupSubscriptionRepo.find({
			where: {
				groupId: String(groupId),
				groupSubscriptionStatus: "active",
			},
			relations: { subscription: true },
			order: { startedAt: "DESC" },
		});
		const activeNow = activeTiers.filter(
			(s) =>
				(!s.startedAt || s.startedAt <= now) &&
				(!s.endedAt || s.endedAt >= now),
		);
		const current = (activeNow.length ? activeNow : activeTiers).reduce(
			(best, cur) => {
				if (!best) return cur;
				const cmp = compareSubscriptions(cur.subscription, best.subscription);
				if (cmp !== 0) return cmp > 0 ? cur : best;
				const bestStarted = best.startedAt ? best.startedAt.getTime() : 0;
				const curStarted = cur.startedAt ? cur.startedAt.getTime() : 0;
				return curStarted > bestStarted ? cur : best;
			},
			null as any,
		);

		// Apply rule: only upgrade becomes effective immediately.
		const isUpgrade =
			!current ||
			compareSubscriptions(purchasedSubscription, current.subscription) > 0;
		const canScheduleAfterCurrent =
			!!current?.endedAt && current.endedAt.getTime() > now.getTime();

		const startedAt =
			!isUpgrade && canScheduleAfterCurrent ? current.endedAt! : now;
		const endedAt = isFreePurchased
			? null
			: this.addMonths(startedAt, monthQuantity);

		const groupSubscription = await this.groupSubscriptionRepo.save(
			this.groupSubscriptionRepo.create({
				groupId: String(groupId),
				subscriptionId: String(subscriptionId),
				groupSubscriptionStatus: "active",
				monthQuantity,
				remainDays: monthQuantity * 30,
				paymentBy,
				isPaid: true,
				startedAt,
				endedAt,
			}),
		);

		// Create entitlement snapshot for this purchased tier (effective at its startedAt).
		await this.ensureEntitlementSnapshot({
			groupId: String(groupId),
			subscriptionId: String(subscriptionId),
			effectiveFrom: startedAt,
			effectiveTo: endedAt,
			makeCurrent: isUpgrade && startedAt.getTime() === now.getTime(),
			source: "purchase",
			createdBy: String(createdBy),
		});

		// If this purchase is an upgrade applied now, postpone overlapping active tiers until after it ends.
		const anchor = endedAt;
		if (isUpgrade && anchor) {
			const overlappingActive = activeTiers.filter(
				(s) =>
					s.id !== groupSubscription.id &&
					(!s.startedAt || s.startedAt <= now) &&
					(!s.endedAt || s.endedAt >= now),
			);

			const shiftedTierIds: string[] = [];
			await Promise.all(
				overlappingActive.map(async (s) => {
					const isFreePlan = Number(s.subscription?.price ?? 0) <= 0;
					const monthQty =
						Number.isFinite(s.monthQuantity) && (s.monthQuantity ?? 0) >= 1
							? s.monthQuantity
							: 1;

					const newStartedAt = anchor;
					const patch: Partial<typeof s> = { startedAt: newStartedAt };
					if (!isFreePlan) {
						patch.endedAt = this.addMonths(newStartedAt, monthQty);
					}
					await this.groupSubscriptionRepo.update(s.id, patch);
					shiftedTierIds.push(String(s.id));
				}),
			);

			// Insert entitlement snapshots for shifted tiers so runtime reflects the schedule.
			if (shiftedTierIds.length) {
				const shifted = await this.groupSubscriptionRepo.find({
					where: { id: In(shiftedTierIds) },
				});
				await Promise.all(
					shifted.map((s) =>
						this.ensureEntitlementSnapshot({
							groupId: String(groupId),
							subscriptionId: String(s.subscriptionId),
							effectiveFrom: s.startedAt ?? anchor,
							effectiveTo: s.endedAt ?? null,
							makeCurrent: false,
							source: "change",
							createdBy: String(createdBy),
						}),
					),
				);
			}
		}

		return groupSubscription;
	}

	private async assertUserInGroup(groupId: string, userId: string) {
		const group = await this.groupRepo.findOneBy({ id: groupId });
		if (!group) throw new BadRequestException("Group not found");
		if (group.createdBy === userId) return group;

		const membership = await this.userGroupRepo.findOne({
			where: { groupId, userId },
		});
		if (!membership) {
			throw new BadRequestException("Only group members can create a payment");
		}
		return group;
	}

	async createDepositUrl(dto: CreatePaymentRequest) {
		const currentUserId = this.cls.get("profile.id");
		const currentUsername = this.cls.get("profile.username") || "unknown";
		if (!currentUserId)
			throw new BadRequestException("Missing authenticated user");

		await this.assertUserInGroup(String(dto.groupId), String(currentUserId));

		const transactionType = String(dto.transactionType ?? "SUBSCRIPTION");

		let resolvedMonthQuantity = Number.isFinite(dto.monthQuantity)
			? dto.monthQuantity
			: 1;

		// If this is a share-fund donation, validate the fund and contribution limit upfront.
		let resolvedSubscriptionId = String(dto.subscriptionId);
		if (transactionType === "DONATION") {
			const shareFundId = dto.shareFundId ? String(dto.shareFundId) : "";
			if (!shareFundId) throw new BadRequestException("Missing shareFundId");
			const shareFund = await this.shareFundRepo.findOneBy({
				id: shareFundId,
				groupId: String(dto.groupId),
			});
			if (!shareFund) throw new BadRequestException("Share fund not found");

			resolvedSubscriptionId = String(shareFund.subscriptionId);
			resolvedMonthQuantity =
				Number.isFinite(shareFund.monthQuantity) &&
				(shareFund.monthQuantity ?? 0) >= 1
					? shareFund.monthQuantity
					: 1;

			if (shareFund.contributeTime != null) {
				const maxTimes = Number(shareFund.contributeTime);
				if (Number.isFinite(maxTimes) && maxTimes > 0) {
					const donatedTimes = await this.transactionRepo.count({
						where: {
							shareFundId: shareFund.id,
							transactionType: "DONATION",
							transactionStatus: "SUCCESS",
						},
					});
					if (donatedTimes >= maxTimes) {
						throw new BadRequestException(
							"Share fund contribution limit reached",
						);
					}
				}
			}
		}

		const subscription = await this.subscriptionRepo.findOneBy({
			id: resolvedSubscriptionId,
		});
		if (!subscription) throw new BadRequestException("Subscription not found");

		const txnRef = `${Date.now()}_${currentUserId}`;
		const monthQuantity = resolvedMonthQuantity;
		const orderInfo = makeOrderInfo({
			uid: String(currentUserId),
			gid: String(dto.groupId),
			sid: String(resolvedSubscriptionId),
			mq: monthQuantity,
		});

		if (!Env.VNP_RETURN_URL) {
			throw new BadRequestException("Missing VNP_RETURN_URL");
		}

		// Business rule:
		// - Subscription payment: one transaction per order (create a new Order per payment).
		// - Share-fund donation: many transactions per order (reuse a single Order per shareFundId).
		let order = null as any;
		if (transactionType === "DONATION") {
			const shareFundId = dto.shareFundId ? String(dto.shareFundId) : "";
			// Find an existing donation order via latest donation transaction that has an orderId.
			const latestDonationTx = await this.transactionRepo.findOne({
				where: {
					shareFundId,
					transactionType: "DONATION",
					orderId: Not(IsNull()),
				},
				relations: { order: true },
				order: { createdAt: "DESC" },
			});
			order = latestDonationTx?.order ?? null;
			if (!order) {
				order = await this.orderRepo.save(
					this.orderRepo.create({
						groupId: String(dto.groupId),
						subscriptionId: String(resolvedSubscriptionId),
						monthQuantity,
						paymentBy: "Share funds",
						orderStatus: "PENDING",
						orderCode: `SF_${shareFundId}`,
						createdBy: String(currentUserId),
					}),
				);
			}
		} else {
			// Create pending order before redirecting to VNPay.
			order = await this.orderRepo.save(
				this.orderRepo.create({
					groupId: String(dto.groupId),
					subscriptionId: String(resolvedSubscriptionId),
					monthQuantity,
					paymentBy: currentUsername,
					orderStatus: "PENDING",
					orderCode: txnRef,
					createdBy: String(currentUserId),
				}),
			);
		}

		// Create pending transaction before redirecting to VNPay.
		await this.transactionRepo.insert(
			this.transactionRepo.create({
				vndAmount: String(Math.round(dto.amount)),
				transactionMessage: null,
				paymentMethod: "VNPAY",
				transactionStatus: "PENDING",
				transactionType,
				transactionCode: txnRef,
				userId: String(currentUserId),
				groupId: String(dto.groupId),
				shareFundId: dto.shareFundId ? String(dto.shareFundId) : null,
				subscriptionId: String(resolvedSubscriptionId),
				orderId: order ? order.id : null,
			}),
		);

		const paymentUrl = this.vnpay.buildPaymentUrl(
			{
				vnp_Amount: Math.round(dto.amount),
				vnp_IpAddr: normalizeIpAddr(dto.ipAddr),
				vnp_TxnRef: txnRef,
				vnp_OrderInfo: orderInfo,
				vnp_OrderType: ProductCode.Other,
				vnp_ReturnUrl: Env.VNP_RETURN_URL,
				vnp_Locale: VnpLocale.VN,
			},
			{
				logger: {
					type: "all",
					loggerFn: consoleLogger,
				},
			},
		);

		return { paymentUrl };
	}

	async handleCallback(query: ReturnQueryFromVNPay) {
		const currentUsername = this.cls.get("profile.username") || "unknown";
		const verified = await this.vnpay.verifyReturnUrl(query);
		const parsed = parseOrderInfo(verified.vnp_OrderInfo);

		const txnRef = String(verified.vnp_TxnRef ?? "");
		const vndAmount = toVndAmountFromVnpay(verified.vnp_Amount);

		const existingTx = txnRef
			? await this.transactionRepo.findOne({
					where: { transactionCode: txnRef },
				})
			: null;

		// If VNPay signature verification fails, do not mutate state.
		if (!verified.isVerified) {
			return {
				isSuccess: verified.isSuccess,
				isVerified: verified.isVerified,
				message: verified.message,
				amount: verified.vnp_Amount,
				orderInfo: verified.vnp_OrderInfo,
				txnRef: verified.vnp_TxnRef,
				bankCode: verified.vnp_BankCode,
				payDate: verified.vnp_PayDate,
				transactionNo: verified.vnp_TransactionNo,
				responseCode: verified.vnp_ResponseCode,
			};
		}

		const alreadyProcessed = existingTx?.transactionStatus === "SUCCESS";
		const paidMonths =
			Number.isFinite(parsed.monthQuantity) && (parsed.monthQuantity ?? 0) >= 1
				? (parsed.monthQuantity as number)
				: 1;

		const txType = existingTx?.transactionType ?? "SUBSCRIPTION";
		const isDonationFlow = txType === "DONATION" && !!existingTx?.shareFundId;
		let donationReachedTarget = false;

		// Persist success (idempotent-ish).
		if (verified.isSuccess && !alreadyProcessed) {
			const groupId = existingTx?.groupId ?? parsed.groupId;
			const payerUserId = existingTx?.userId ?? parsed.userId;

			if (groupId && payerUserId) {
				await this.assertUserInGroup(String(groupId), String(payerUserId));
			}

			// Assign subscription role for the payer.
			if (payerUserId) {
				await this.addUserSubscriptionRole(
					String(payerUserId),
					isDonationFlow ? "CONTRIBUTION" : "SPONSOR",
				);
			}

			if (isDonationFlow) {
				const shareFundId = String(existingTx?.shareFundId);
				const shareFund = await this.shareFundRepo.findOneBy({
					id: shareFundId,
					groupId: String(groupId),
				});
				// Share fund may have already been completed and deleted by another payment callback.
				if (!shareFund) {
					// Nothing to apply to the fund, but the payment itself is still valid.
					// In this case, treat it as already reached so donation orders can be finalized.
					donationReachedTarget = true;
				} else {
					// Apply donation amount to the share fund.
					const currentAmount = BigInt(shareFund.currentVndAmount ?? "0");
					const donateAmount = BigInt(String(vndAmount ?? "0"));
					const nextAmount = currentAmount + donateAmount;
					await this.shareFundRepo.update(shareFund.id, {
						currentVndAmount: String(nextAmount),
					});

					// Share fund target is the subscription total: price * monthQuantity.
					const targetSubscription = await this.subscriptionRepo.findOneBy({
						id: String(shareFund.subscriptionId),
					});
					if (targetSubscription) {
						const monthQty =
							Number.isFinite(shareFund.monthQuantity) &&
							(shareFund.monthQuantity ?? 0) >= 1
								? shareFund.monthQuantity
								: 1;
						const price = Number(targetSubscription.price ?? 0);
						const targetAmount = BigInt(String(Math.round(price * monthQty)));

						if (targetAmount > 0n && nextAmount >= targetAmount) {
							await this.applyGroupSubscription({
								groupId: String(groupId),
								subscriptionId: String(shareFund.subscriptionId),
								monthQuantity: monthQty,
								paymentBy: currentUsername,
								createdBy: String(payerUserId ?? ""),
							});
							// After successfully applying the subscription, delete the share fund.
							await this.shareFundRepo.delete(shareFund.id);
							donationReachedTarget = true;
						}
					}
				}
			} else {
				const subscriptionId =
					parsed.subscriptionId ?? existingTx?.subscriptionId;
				if (!groupId || !subscriptionId || !payerUserId) {
					throw new BadRequestException("Missing payment context");
				}
				await this.applyGroupSubscription({
					groupId: String(groupId),
					subscriptionId: String(subscriptionId),
					monthQuantity: paidMonths,
					paymentBy: currentUsername,
					createdBy: String(payerUserId),
				});
			}
		}

		if (existingTx) {
			await this.transactionRepo.update(existingTx.id, {
				vndAmount,
				transactionMessage: verified.message ?? null,
				paymentMethod: "VNPAY",
				transactionStatus: verified.isSuccess ? "SUCCESS" : "FAILED",
				transactionType:
					existingTx.transactionType ??
					(isDonationFlow ? "DONATION" : "SUBSCRIPTION"),
				groupId: existingTx.groupId ?? parsed.groupId ?? null,
				subscriptionId:
					parsed.subscriptionId ?? existingTx.subscriptionId ?? null,
				shareFundId: existingTx.shareFundId ?? null,
			});
		} else if (txnRef) {
			await this.transactionRepo.insert(
				this.transactionRepo.create({
					vndAmount,
					transactionMessage: verified.message ?? null,
					paymentMethod: "VNPAY",
					transactionStatus: verified.isSuccess ? "SUCCESS" : "FAILED",
					transactionType: "SUBSCRIPTION",
					transactionCode: txnRef,
					userId: parsed.userId ?? "",
					groupId: parsed.groupId ?? null,
					shareFundId: null,
					subscriptionId: parsed.subscriptionId ?? null,
				}),
			);
		}

		// Order status update rules:
		// - Subscription payments: one transaction per order; set order to PAID or FAILED.
		// - Share-fund donations: many transactions share one order; keep order PENDING until the share-fund target is reached,
		//   then set order to PAID. Donation failures should NOT set the shared order to FAILED.
		if (verified.isVerified) {
			const orderIdFromTx = existingTx?.orderId
				? String(existingTx.orderId)
				: null;
			const orderId = orderIdFromTx
				? orderIdFromTx
				: txnRef
					? ((await this.orderRepo.findOneBy({ orderCode: txnRef }))?.id ??
						null)
					: null;

			if (orderId) {
				if (isDonationFlow) {
					// Donation payments should not flip the shared order to FAILED.
					if (!verified.isSuccess) {
						// keep PENDING
					} else {
						const shareFundId = existingTx?.shareFundId
							? String(existingTx.shareFundId)
							: null;

						// If this callback didn't compute reaching target (e.g., alreadyProcessed), re-check current fund state.
						if (!donationReachedTarget && shareFundId) {
							const groupId = existingTx?.groupId ?? parsed.groupId;
							if (groupId) {
								const shareFund = await this.shareFundRepo.findOneBy({
									id: shareFundId,
									groupId: String(groupId),
								});
								if (!shareFund) {
									donationReachedTarget = true;
								} else {
									const targetSubscription =
										await this.subscriptionRepo.findOneBy({
											id: String(shareFund.subscriptionId),
										});
									if (targetSubscription) {
										const monthQty =
											Number.isFinite(shareFund.monthQuantity) &&
											(shareFund.monthQuantity ?? 0) >= 1
												? shareFund.monthQuantity
												: 1;
										const price = Number(targetSubscription.price ?? 0);
										const targetAmount = BigInt(
											String(Math.round(price * monthQty)),
										);
										const currentAmount = BigInt(
											shareFund.currentVndAmount ?? "0",
										);
										donationReachedTarget =
											targetAmount > 0n && currentAmount >= targetAmount;
									}
								}
							}
						}

						if (donationReachedTarget && shareFundId) {
							const successfulDonations = await this.transactionRepo.find({
								where: {
									shareFundId,
									transactionType: "DONATION",
									transactionStatus: "SUCCESS",
								},
							});
							const orderIds = successfulDonations
								.map((t) => t.orderId)
								.filter((id): id is string => !!id);
							if (orderIds.length) {
								await this.orderRepo.update(
									{ id: In(orderIds) },
									{ orderStatus: "PAID" },
								);
							} else {
								// Fallback: at least mark the current order as PAID.
								await this.orderRepo.update(orderId, { orderStatus: "PAID" });
							}
						}
						// else: keep PENDING
					}
				} else {
					if (!verified.isSuccess) {
						await this.orderRepo.update(orderId, { orderStatus: "FAILED" });
					} else {
						await this.orderRepo.update(orderId, { orderStatus: "PAID" });
					}
				}
			}
		}

		return {
			isSuccess: verified.isSuccess,
			isVerified: verified.isVerified,
			message: verified.message,
			amount: verified.vnp_Amount,
			orderInfo: verified.vnp_OrderInfo,
			txnRef: verified.vnp_TxnRef,
			bankCode: verified.vnp_BankCode,
			payDate: verified.vnp_PayDate,
			transactionNo: verified.vnp_TransactionNo,
			responseCode: verified.vnp_ResponseCode,
			groupId: parsed.groupId,
			subscriptionId: parsed.subscriptionId,
			shareFundId: existingTx?.shareFundId ?? null,
			transactionType: existingTx?.transactionType ?? "SUBSCRIPTION",
			// groupSubscriptionId is returned only by the group-subscription module now.
		};
	}
}
