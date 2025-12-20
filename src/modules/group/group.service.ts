import { Injectable, Logger } from "@nestjs/common";
import { CreateGroupRequest, UpdateGroupRequest } from "./dto";
import { GroupMemberLimitReachedError, GroupNotExistedError } from "./errors";
import { DevChatCls, InvitationStatus } from "@utils";
import { ClsService } from "nestjs-cls";
import {
	ChannelRepository,
	GroupSubscriptionRepository,
	GroupRepository,
	SubscriptionRepository,
	UserGroupRepository,
} from "@db/repositories";
import { Transactional } from "typeorm-transactional";
import { GroupSubscriptionResponse } from "@modules/group-subscription/dto";

@Injectable()
export class GroupService {
	private readonly logger = new Logger(GroupService.name);

	constructor(
		private readonly groupRepo: GroupRepository,
		private readonly userGroupRepo: UserGroupRepository,
		private readonly channelRepo: ChannelRepository,
		private readonly subscriptionRepo: SubscriptionRepository,
		private readonly groupSubscriptionRepo: GroupSubscriptionRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	@Transactional()
	async createOne(dto: CreateGroupRequest) {
		const createdBy = this.cls.get("profile").id;
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
			const freeSubscription = await this.subscriptionRepo.findOneBy({
				subscriptionCode: "FREE_00",
			});
			if (!freeSubscription) {
				this.logger.warn(
					"Default free subscription (FREE_00) not found; skipping group subscription creation.",
				);
			} else {
				await this.groupSubscriptionRepo.insert(
					this.groupSubscriptionRepo.create({
						groupId,
						subscriptionId: freeSubscription.id,
						groupSubscriptionStatus: "active",
						monthQuantity: 1,
						paymentBy: "free",
						isPaid: true,
						startedAt: new Date(),
						endedAt: null,
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
		const userId = this.cls.get("profile").id;
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
		const userId = this.cls.get("profile").id;
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
			subscription?: { levelSubscription?: number | null } | null;
		},
	>(items: T[]): T | null {
		if (!items?.length) return null;

		const levelOf = (s: T) => Number(s.subscription?.levelSubscription ?? 0);
		const startedAtTimeOf = (s: T) => (s.startedAt ? s.startedAt.getTime() : 0);

		const active = items.filter((s) => s.groupSubscriptionStatus === "active");

		const pickHighestLevel = (candidates: T[]) => {
			if (!candidates.length) return null;
			return candidates.reduce<T>((best, cur) => {
				const bestLevel = levelOf(best);
				const curLevel = levelOf(cur);
				if (curLevel !== bestLevel) return curLevel > bestLevel ? cur : best;
				// tie-breaker: most recent startedAt
				return startedAtTimeOf(cur) > startedAtTimeOf(best) ? cur : best;
			}, candidates[0]);
		};

		// Prefer subscriptions active right now; otherwise, pick the highest level among all active records.
		return pickHighestLevel(active) ?? pickHighestLevel(items);
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

		const current = this.pickCurrentGroupSubscription(groupSubscriptions);

		return {
			currentSubscription: current
				? GroupSubscriptionResponse.fromEntity(current)
				: null,
			subscriptions: GroupSubscriptionResponse.fromEntities(groupSubscriptions),
		};
	}

	async deleteOne(id: string) {
		// when have table user group will check if user is the owner of the group
		const group = await this.findOne(id);
		group.isActive = false;
		await this.groupRepo.save(group);
	}
}
