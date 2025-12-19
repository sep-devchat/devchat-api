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
	ShareFundRepository,
	SubscriptionRepository,
	TransactionRepository,
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
		private readonly transactionRepo: TransactionRepository,
	) {}

	private addMonths(from: Date, months: number) {
		const d = new Date(from);
		d.setMonth(d.getMonth() + months);
		return d;
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
		if (!currentUserId)
			throw new BadRequestException("Missing authenticated user");

		await this.assertUserInGroup(String(dto.groupId), String(currentUserId));

		const transactionType = String(dto.transactionType ?? "SUBSCRIPTION");

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
		const monthQuantity = Number.isFinite(dto.monthQuantity)
			? dto.monthQuantity
			: 1;
		const orderInfo = makeOrderInfo({
			uid: String(currentUserId),
			gid: String(dto.groupId),
			sid: String(resolvedSubscriptionId),
			mq: monthQuantity,
		});

		if (!Env.VNP_RETURN_URL) {
			throw new BadRequestException("Missing VNP_RETURN_URL");
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

		// Persist success (idempotent-ish).
		if (verified.isSuccess && !alreadyProcessed) {
			const groupId = existingTx?.groupId ?? parsed.groupId;
			const payerUserId = existingTx?.userId ?? parsed.userId;

			if (groupId && payerUserId) {
				await this.assertUserInGroup(String(groupId), String(payerUserId));
			}

			if (isDonationFlow) {
				const shareFundId = String(existingTx?.shareFundId);
				const shareFund = await this.shareFundRepo.findOneBy({
					id: shareFundId,
					groupId: String(groupId),
				});
				if (!shareFund) throw new BadRequestException("Share fund not found");

				// Apply donation amount to the share fund.
				const currentAmount = BigInt(shareFund.currentVndAmount ?? "0");
				const donateAmount = BigInt(String(vndAmount ?? "0"));
				const nextAmount = currentAmount + donateAmount;
				await this.shareFundRepo.update(shareFund.id, {
					currentVndAmount: String(nextAmount),
				});
			} else {
				const subscriptionId =
					parsed.subscriptionId ?? existingTx?.subscriptionId;
				if (!groupId || !subscriptionId || !payerUserId) {
					throw new BadRequestException("Missing payment context");
				}

				const purchasedSubscription = await this.subscriptionRepo.findOneBy({
					id: String(subscriptionId),
				});
				if (!purchasedSubscription)
					throw new BadRequestException("Subscription not found");

				const startedAt = new Date();
				const endedAt = new Date(startedAt);
				endedAt.setMonth(endedAt.getMonth() + paidMonths);

				const groupSubscription = await this.groupSubscriptionRepo.save(
					this.groupSubscriptionRepo.create({
						groupId,
						subscriptionId: String(subscriptionId),
						groupSubscriptionStatus: "active",
						monthQuantity: paidMonths,
						paymentBy: currentUsername,
						isPaid: true,
						startedAt,
						endedAt,
					}),
				);

				// If the purchased plan is the highest level in the group, schedule other active tiers
				// to start after this higher tier ends (free plan keeps its end date unchanged).
				const purchasedLevel = Number(
					purchasedSubscription.levelSubscription ?? 0,
				);
				const anchor = groupSubscription.endedAt;
				if (anchor) {
					const now = new Date();
					const activeTiers = await this.groupSubscriptionRepo.find({
						where: {
							groupId: String(groupId),
							groupSubscriptionStatus: "active",
						},
						relations: { subscription: true },
					});

					const otherActive = activeTiers.filter(
						(s) =>
							s.id !== groupSubscription.id && (!s.endedAt || s.endedAt >= now),
					);

					const maxOtherLevel = otherActive.reduce((max, s) => {
						const level = Number(s.subscription?.levelSubscription ?? 0);
						return level > max ? level : max;
					}, -Infinity);

					if (purchasedLevel > maxOtherLevel) {
						await Promise.all(
							otherActive.map(async (s) => {
								const isFreePlan = Number(s.subscription?.price ?? 0) <= 0;
								const monthQty =
									Number.isFinite(s.monthQuantity) &&
									(s.monthQuantity ?? 0) >= 1
										? s.monthQuantity
										: 1;

								const newStartedAt = anchor;
								const patch: Partial<typeof s> = { startedAt: newStartedAt };
								if (!isFreePlan) {
									patch.endedAt = this.addMonths(newStartedAt, monthQty);
								}
								await this.groupSubscriptionRepo.update(s.id, patch);
							}),
						);
					}
				}
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
