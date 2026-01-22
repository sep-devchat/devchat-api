import { Injectable } from "@nestjs/common";
import { ShareFundRepository } from "@db/repositories";
import { SubscriptionRepository } from "@db/repositories";
import { TransactionRepository } from "@db/repositories";
import { GroupEntity, SubscriptionEntity } from "@db/entities";
import { GroupService } from "@modules/group";
import { UserGroupService } from "@modules/user-group";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";
import {
	CreateShareFundRequest,
	DonateShareFundRequest,
	ShareFundQuery,
} from "./dto";
import {
	NotGroupOwnerError,
	NotGroupMemberError,
	ShareFundAlreadyExistsError,
	ShareFundContributionLimitReachedError,
	ShareFundHasTransactionsError,
	ShareFundNotFoundError,
	SubscriptionNotFoundError,
} from "./errors";
import { Not } from "typeorm";

@Injectable()
export class ShareFundService {
	constructor(
		private readonly repo: ShareFundRepository,
		private readonly subscriptionRepo: SubscriptionRepository,
		private readonly transactionRepo: TransactionRepository,
		private readonly groupService: GroupService,
		private readonly userGroupService: UserGroupService,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	async findMany(_query: ShareFundQuery) {
		return this.repo.find();
	}

	async findManyInGroup(groupId: string, query: ShareFundQuery) {
		const qb = this.repo
			.createQueryBuilder("shareFund")
			.leftJoinAndMapOne(
				"shareFund.group",
				GroupEntity,
				"group",
				"group.id = shareFund.groupId",
			)
			.leftJoinAndMapOne(
				"shareFund.subscription",
				SubscriptionEntity,
				"subscription",
				"subscription.id = shareFund.subscriptionId",
			)
			.where("shareFund.groupId = :groupId", { groupId });

		if (query.subscriptionId) {
			qb.andWhere("shareFund.subscriptionId = :subscriptionId", {
				subscriptionId: query.subscriptionId,
			});
		}

		return qb.getMany();
	}

	async createOne(groupId: string, dto: CreateShareFundRequest) {
		const currentUserId = this.cls.get("profile")?.id;
		const group = await this.groupService.findOne(groupId);
		if (!currentUserId || group.createdBy !== currentUserId) {
			throw new NotGroupOwnerError();
		}

		const subscription = await this.subscriptionRepo.findOneBy({
			id: dto.subscriptionId,
		});
		if (!subscription) throw new SubscriptionNotFoundError();

		const existed = await this.repo.findOneBy({
			groupId,
			subscriptionId: dto.subscriptionId,
		});
		if (existed) throw new ShareFundAlreadyExistsError();

		const shareFund = this.repo.create({
			groupId,
			subscriptionId: dto.subscriptionId,
			monthQuantity:
				Number.isFinite(dto.monthQuantity) && (dto.monthQuantity ?? 0) >= 1
					? (dto.monthQuantity as number)
					: 1,
			fundName: dto.fundName ?? `${subscription.subscriptionName} fund`,
			contributeTime: dto.contributeTime ?? null,
		});

		await this.repo.insert(shareFund);
		return this.repo.findOneByOrFail({ id: shareFund.id });
	}

	async donate(
		groupId: string,
		shareFundId: string,
		dto: DonateShareFundRequest,
	) {
		const currentUserId = this.cls.get("profile")?.id;
		if (!currentUserId) throw new NotGroupMemberError();

		// ensure group exists
		await this.groupService.findOne(groupId);

		const isMember = await this.userGroupService.isMember(
			groupId,
			currentUserId,
		);
		if (!isMember) throw new NotGroupMemberError();

		const shareFund = await this.repo.findOneBy({ id: shareFundId, groupId });
		if (!shareFund) throw new ShareFundNotFoundError();

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
					throw new ShareFundContributionLimitReachedError();
				}
			}
		}

		const currentAmount = BigInt(shareFund.currentVndAmount ?? "0");
		const donateAmount = BigInt(dto.amount);
		const nextAmount = currentAmount + donateAmount;

		const tx = this.transactionRepo.create({
			vndAmount: String(dto.amount),
			transactionMessage: dto.message ?? null,
			paymentMethod: "SHARE_FUND",
			transactionStatus: "SUCCESS",
			transactionType: "DONATION",
			transactionCode: `${Date.now()}`,
			userId: currentUserId,
			groupId,
			shareFundId: shareFund.id,
		});

		await this.transactionRepo.insert(tx);
		await this.repo.update(
			{ id: shareFund.id },
			{ currentVndAmount: String(nextAmount) },
		);

		return this.repo.findOneByOrFail({ id: shareFund.id });
	}

	async deleteOneInGroup(groupId: string, shareFundId: string) {
		const currentUserId = this.cls.get("profile")?.id;
		const group = await this.groupService.findOne(groupId);
		if (!currentUserId || group.createdBy !== currentUserId) {
			throw new NotGroupOwnerError();
		}

		const shareFund = await this.repo.findOneBy({ id: shareFundId, groupId });
		if (!shareFund) throw new ShareFundNotFoundError();

		const currentAmount = BigInt(shareFund.currentVndAmount ?? "0");
		const nonPendingTxCount = await this.transactionRepo.count({
			where: {
				shareFundId: shareFund.id,
				transactionStatus: Not("PENDING"),
			},
		});
		if (nonPendingTxCount > 0 || currentAmount > 0n) {
			throw new ShareFundHasTransactionsError();
		}

		// If there are only PENDING contributions, allow delete. Clean them up first
		// in case the database has FK constraints.
		await this.transactionRepo.delete({
			shareFundId: shareFund.id,
			transactionStatus: "PENDING",
		});

		await this.repo.delete(shareFund.id);
		return shareFund;
	}

	async findOne(id: string) {
		return this.repo.findOneByOrFail({ id });
	}
}
