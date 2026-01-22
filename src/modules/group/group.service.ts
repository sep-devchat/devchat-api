import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { CreateGroupRequest, UpdateGroupRequest } from "./dto";
import { GroupMemberLimitReachedError, GroupNotExistedError } from "./errors";
import { DevChatCls, InvitationStatus } from "@utils";
import { ClsService } from "nestjs-cls";
import {
	ChannelRepository,
	GroupEntitlementRepository,
	GroupSupportedProgrammingLanguageRepository,
	GroupSubscriptionRepository,
	GroupUsageRepository,
	GroupRepository,
	SubscriptionRepository,
	UserGroupRepository,
} from "@db/repositories";
import { Transactional } from "typeorm-transactional";
import { GroupSubscriptionResponse } from "@modules/group-subscription/dto";
import { GroupEntitlementResponse, GroupUsageResponse } from "./dto";
import { v } from "@faker-js/faker/dist/airline-DF6RqYmq";
import { In, IsNull, Not } from "typeorm";
import { compareSubscriptions } from "@utils";

const billingCycleKeyOf = (d: Date) => {
	const yyyy = d.getUTCFullYear();
	const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
	return `${yyyy}-${mm}`;
};

const monthBoundsUtc = (d: Date) => {
	const start = new Date(
		Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0),
	);
	const end = new Date(
		Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 0, 0, 0),
	);
	return { start, end };
};

@Injectable()
export class GroupService {
	private readonly logger = new Logger(GroupService.name);

	constructor(
		private readonly groupRepo: GroupRepository,
		private readonly userGroupRepo: UserGroupRepository,
		private readonly channelRepo: ChannelRepository,
		private readonly subscriptionRepo: SubscriptionRepository,
		private readonly groupSubscriptionRepo: GroupSubscriptionRepository,
		private readonly groupEntitlementRepo: GroupEntitlementRepository,
		private readonly groupUsageRepo: GroupUsageRepository,
		private readonly groupLanguageRepo: GroupSupportedProgrammingLanguageRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	@Transactional()
	async createOne(dto: CreateGroupRequest) {
		const createdBy = this.cls.get("profile")?.id;
		if (!createdBy) {
			throw new UnauthorizedException("Missing authenticated user context");
		}
		const group = this.groupRepo.create({
			name: dto.name,
			avatar: dto.avatar ?? null,
			description: dto.description ?? null,
			createdBy,
		});

		const insertResult = await this.groupRepo.insert(group);
		const groupId = insertResult.identifiers?.[0]?.id;
		if (!groupId) throw new Error("Failed to create group id");
		await this.channelRepo.insert({
			name: "welcome",
			description: "Welcome channel",
			createdBy: createdBy,
			groupId,
			createdAt: new Date(),
		});

		await this.userGroupRepo.insert({
			groupId,
			invitedAt: new Date(),
			joinedAt: new Date(),
			userId: createdBy,
			addedById: createdBy,
		});

		// Attach default FREE plan to newly created group.
		try {
			const freeSubscription = await this.subscriptionRepo.findOne({
				where: { subscriptionCode: "FREE" },
				order: {
					isActive: "DESC",
					version: "DESC",
				},
			});
			if (!freeSubscription) {
				this.logger.warn(
					"Default free subscription (FREE) not found; skipping group subscription creation.",
				);
			} else {
				const now = new Date();
				const billingCycleKey = billingCycleKeyOf(now);
				const { start: periodStart, end: periodEnd } = monthBoundsUtc(now);

				await this.groupSubscriptionRepo.insert(
					this.groupSubscriptionRepo.create({
						groupId,
						subscriptionId: freeSubscription.id,
						groupSubscriptionStatus: "active",
						monthQuantity: -1,
						paymentBy: "free",
						isPaid: true,
						startedAt: now,
						endedAt: null,
					}),
				);

				// Create entitlement snapshot for runtime checks (immutable).
				await this.groupEntitlementRepo.insert(
					this.groupEntitlementRepo.create({
						groupId,
						effectiveFrom: now,
						effectiveTo: null,
						source: "migration",
						subscriptionId: freeSubscription.id,
						isCurrent: true,
						entitlements: {
							subscription: {
								code: freeSubscription.subscriptionCode,
								name: freeSubscription.subscriptionName,
							},
							features: {
								ai: Boolean(freeSubscription.isAIActive),
							},
							limits: {
								members: Number(freeSubscription.limitMembers ?? 0),
								runCodePerDay: Number(freeSubscription.runCodePerDay ?? 0),
								programmingLanguagesInGroups: Number(
									freeSubscription.programmingLanguageInGroups ?? 0,
								),
							},
						},
						createdBy,
					}),
				);

				// Create current-cycle usage row (starts at zero).
				await this.groupUsageRepo.insert(
					this.groupUsageRepo.create({
						groupId,
						billingCycleKey,
						periodStart,
						periodEnd,
						messagesSent: 0,
						fileBytesUploaded: "0",
						runCodeExecutions: 0,
						aiTokensConsumed: "0",
					}),
				);
			}
		} catch (err: any) {
			this.logger.error(
				`Failed creating default free group subscription: ${err?.message ?? String(err)}`,
				err?.stack,
			);
		}

		return await this.groupRepo.findOne({
			where: { id: groupId },
		});
	}

	async updateOne(id: string, dto: UpdateGroupRequest) {
		// check if group exists
		await this.findOne(id);

		await this.groupRepo.update(id, dto);
	}

	async findMany() {
		const userId = this.cls.get("profile")?.id;
		if (!userId) {
			throw new UnauthorizedException("Missing authenticated user context");
		}
		return await this.groupRepo.find({
			where: [
				{
					createdBy: userId,
				},
				{
					userGroups: {
						userId: userId,
					},
				},
			],
		});
	}

	async findOne(id: string) {
		const userId = this.cls.get("profile.id");
		const group = await this.groupRepo.findOne({
			where: [
				{
					id,
					createdBy: userId,
				},
				{
					id,
					userGroups: {
						userId: userId,
					},
				},
			],
		});
		if (!group) {
			throw new GroupNotExistedError();
		}
		return group;
	}

	private pickCurrentGroupSubscription<
		T extends {
			groupSubscriptionStatus: string;
			startedAt: Date | null;
			endedAt: Date | null;
			subscription?: {
				price?: number | string | null;
				limitMembers?: number | string | null;
				programmingLanguageInGroups?: number | string | null;
				runCodePerDay?: number | string | null;
			} | null;
		},
	>(items: T[]): T | null {
		if (!items?.length) return null;
		const now = new Date();

		const startedAtTimeOf = (s: T) => (s.startedAt ? s.startedAt.getTime() : 0);
		const isActiveStatus = (s: T) => s.groupSubscriptionStatus === "active";
		const isStarted = (s: T) => !s.startedAt || s.startedAt <= now;
		const notEnded = (s: T) => !s.endedAt || s.endedAt >= now;

		const activeNow = items.filter(
			(s) => isActiveStatus(s) && isStarted(s) && notEnded(s),
		);
		const activeAny = items.filter((s) => isActiveStatus(s));

		const pickBest = (candidates: T[]) => {
			if (!candidates.length) return null;
			return candidates.reduce<T>((best, cur) => {
				const cmp = compareSubscriptions(cur.subscription, best.subscription);
				if (cmp !== 0) return cmp > 0 ? cur : best;
				// tie-breaker: most recent startedAt
				return startedAtTimeOf(cur) > startedAtTimeOf(best) ? cur : best;
			}, candidates[0]);
		};

		// Prefer subscriptions active right now; otherwise, pick the best among active records.
		return pickBest(activeNow) ?? pickBest(activeAny) ?? pickBest(items);
	}

	private async getCurrentGroupSubscriptionEntityUnchecked(groupId: string) {
		// Existence check without access constraints (needed for invitation acceptance).
		const group = await this.groupRepo.findOneBy({ id: groupId });
		if (!group) throw new GroupNotExistedError();

		const groupSubscriptions = await this.groupSubscriptionRepo.find({
			where: { groupId },
			relations: { subscription: true },
			order: { subscription: { levelSubscription: "DESC" } },
		});

		try {
			const currentEntitlement = await this.groupEntitlementRepo.findOne({
				where: { groupId, isCurrent: true },
				order: { effectiveFrom: "DESC" },
			});
			if (currentEntitlement?.subscriptionId) {
				const match = groupSubscriptions
					.filter((s) => s.subscriptionId === currentEntitlement.subscriptionId)
					.sort(
						(a, b) =>
							(b.startedAt?.getTime() ?? 0) - (a.startedAt?.getTime() ?? 0),
					)[0];
				if (match) return match;
			}
		} catch {
			// ignore and fallback below
		}

		return this.pickCurrentGroupSubscription(groupSubscriptions);
	}

	async assertMemberLimitAllowsNewMembers(groupId: string, toAdd = 1) {
		const current =
			await this.getCurrentGroupSubscriptionEntityUnchecked(groupId);
		const limitMembers = Number(current?.subscription?.limitMembers ?? 0);
		if (!Number.isFinite(limitMembers) || limitMembers <= 0) return;

		const currentMembers = await this.userGroupRepo.count({
			where: { groupId },
		});
		if (currentMembers + toAdd > limitMembers) {
			throw new GroupMemberLimitReachedError(
				limitMembers,
				currentMembers,
				toAdd,
			);
		}
	}

	async findSubscriptionsInGroup(groupId: string) {
		// Ensure current user can access this group
		await this.findOne(groupId);

		const groupSubscriptions = await this.groupSubscriptionRepo.find({
			where: { groupId },
			relations: { subscription: true },
			order: { subscription: { levelSubscription: "DESC" } },
		});

		const now = new Date();
		let currentEntitlementEntity = null as any;
		try {
			// Primary: trust isCurrent marker.
			currentEntitlementEntity = await this.groupEntitlementRepo.findOne({
				where: { groupId, isCurrent: true },
				order: { effectiveFrom: "DESC" },
			});

			// Safety fallback: if missing or stale, compute by time window and (best-effort) repair isCurrent.
			const isStale =
				currentEntitlementEntity &&
				(currentEntitlementEntity.effectiveFrom > now ||
					(currentEntitlementEntity.effectiveTo != null &&
						currentEntitlementEntity.effectiveTo <= now));
			if (!currentEntitlementEntity || isStale) {
				const allEntitlements = await this.groupEntitlementRepo.find({
					where: { groupId },
					order: { effectiveFrom: "DESC" },
				});
				const active = allEntitlements.find(
					(e) =>
						e.effectiveFrom <= now &&
						(e.effectiveTo == null || e.effectiveTo > now),
				);
				currentEntitlementEntity = active ?? allEntitlements[0] ?? null;
				if (currentEntitlementEntity) {
					// Best-effort repair: ensure only one isCurrent=true.
					await this.groupEntitlementRepo.update(
						{ groupId, isCurrent: true },
						{ isCurrent: false },
					);
					await this.groupEntitlementRepo.update(currentEntitlementEntity.id, {
						isCurrent: true,
					});
				}
			}
		} catch (err: any) {
			this.logger.warn(
				`Failed loading group entitlement: ${err?.message ?? String(err)}`,
			);
		}

		const currentEntitlement = currentEntitlementEntity
			? GroupEntitlementResponse.fromEntity(currentEntitlementEntity)
			: null;

		// Prefer current subscription derived from the current entitlement snapshot.
		const currentFromEntitlement = currentEntitlementEntity?.subscriptionId
			? (groupSubscriptions
					.filter(
						(s) => s.subscriptionId === currentEntitlementEntity.subscriptionId,
					)
					.sort(
						(a, b) =>
							(b.startedAt?.getTime() ?? 0) - (a.startedAt?.getTime() ?? 0),
					)[0] ?? null)
			: null;
		const current =
			currentFromEntitlement ??
			this.pickCurrentGroupSubscription(groupSubscriptions);

		const entitlements: Record<string, any> | null =
			currentEntitlementEntity?.entitlements ??
			(current?.subscription
				? {
						features: {
							ai: Boolean(current.subscription.isAIActive),
						},
						limits: {
							members: Number(current.subscription.limitMembers ?? 0),
							runCodePerDay: Number(current.subscription.runCodePerDay ?? 0),
							programmingLanguagesInGroups: Number(
								current.subscription.programmingLanguageInGroups ?? 0,
							),
						},
					}
				: null);

		let entitlementsHistory: GroupEntitlementResponse[] = [];
		try {
			const entitlementEntities = await this.groupEntitlementRepo.find({
				where: { groupId },
				order: { effectiveFrom: "DESC" },
			});

			const subscriptionIds = Array.from(
				new Set(
					entitlementEntities
						.map((e) => e.subscriptionId)
						.filter((id): id is string => Boolean(id)),
				),
			);
			const codeBySubscriptionId = new Map<string, string>();
			if (subscriptionIds.length) {
				const subs = await this.subscriptionRepo.findBy({
					id: In(subscriptionIds),
				});
				for (const s of subs) {
					if (s?.id && s?.subscriptionCode) {
						codeBySubscriptionId.set(s.id, s.subscriptionCode);
					}
				}
			}

			const normalizeKey = (value: unknown) =>
				String(value ?? "")
					.trim()
					.toLowerCase();
			const seen = new Set<string>();
			const distinctEntities = entitlementEntities.filter((e) => {
				const codeFromEntitlements = (e as any)?.entitlements?.subscription
					?.code;
				const codeFromSubscriptionId = e.subscriptionId
					? codeBySubscriptionId.get(e.subscriptionId)
					: undefined;
				const code = codeFromEntitlements ?? codeFromSubscriptionId;
				const key = code
					? normalizeKey(code)
					: e.subscriptionId
						? `unknown:${normalizeKey(e.subscriptionId)}`
						: `unknown-entity:${normalizeKey(e.id)}`;
				if (seen.has(key)) return false;
				seen.add(key);
				return true;
			});

			entitlementsHistory = distinctEntities.map((e) =>
				GroupEntitlementResponse.fromEntity(e),
			);
		} catch (err: any) {
			this.logger.warn(
				`Failed loading entitlement history: ${err?.message ?? String(err)}`,
			);
		}

		let usage: GroupUsageResponse | null = null;
		try {
			const billingCycleKey = billingCycleKeyOf(now);
			const usageEntity = await this.groupUsageRepo.findOneBy({
				groupId,
				billingCycleKey,
			});
			usage = usageEntity ? GroupUsageResponse.fromEntity(usageEntity) : null;
		} catch (err: any) {
			this.logger.warn(
				`Failed loading group usage: ${err?.message ?? String(err)}`,
			);
		}

		// Attach computed usage info (not stored in group_usage table).
		if (usage) {
			try {
				const [currentMembers, currentProgrammingLanguagesInGroups] =
					await Promise.all([
						this.userGroupRepo.count({
							where: { groupId, joinedAt: Not(IsNull()) },
						}),
						this.groupLanguageRepo.count({
							where: { groupId, isActive: true },
						}),
					]);

				usage.currentMembers = currentMembers;
				usage.currentProgrammingLanguagesInGroups =
					currentProgrammingLanguagesInGroups;
			} catch (err: any) {
				this.logger.warn(
					`Failed loading computed usage info: ${err?.message ?? String(err)}`,
				);
			}
		}

		return {
			currentSubscription: current
				? GroupSubscriptionResponse.fromEntity(current)
				: null,
			subscriptions: GroupSubscriptionResponse.fromEntities(groupSubscriptions),
			currentEntitlement,
			entitlementsHistory,
			entitlements,
			usage,
		};
	}

	async deleteOne(id: string) {
		// when have table user group will check if user is the owner of the group
		const group = await this.findOne(id);
		group.isActive = false;
		await this.groupRepo.save(group);
	}
}
