import { ConflictException, Injectable } from "@nestjs/common";
import {
	GroupSubscriptionRepository,
	SubscriptionRepository,
} from "@db/repositories";
import { Brackets } from "typeorm";
import {
	CreateSubscriptionRequest,
	UpdateSubscriptionRequest,
	SubscriptionQuery,
	SubscriptionResponse,
} from "./dto";

@Injectable()
export class SubscriptionService {
	constructor(
		private readonly repo: SubscriptionRepository,
		private readonly groupSubscriptionRepo: GroupSubscriptionRepository,
	) {}

	private normalizeComparableText(value: unknown): string {
		return String(value ?? "")
			.trim()
			.toLowerCase();
	}

	private hasEntitlementLikeChanges(
		current: {
			price: number;
			limitMembers: number;
			isAIActive: boolean;
			runCodePerDay: number;
			programmingLanguageInGroups: number;
			levelSubscription: number;
		},
		dto: UpdateSubscriptionRequest,
	): boolean {
		if (dto.price !== undefined && dto.price !== current.price) return true;
		if (
			dto.limitMembers !== undefined &&
			dto.limitMembers !== current.limitMembers
		)
			return true;
		if (dto.isAIActive !== undefined && dto.isAIActive !== current.isAIActive)
			return true;
		if (
			dto.runCodePerDay !== undefined &&
			dto.runCodePerDay !== current.runCodePerDay
		)
			return true;
		if (
			dto.programmingLanguageInGroups !== undefined &&
			dto.programmingLanguageInGroups !== current.programmingLanguageInGroups
		)
			return true;
		if (
			dto.levelSubscription !== undefined &&
			dto.levelSubscription !== current.levelSubscription
		)
			return true;
		return false;
	}

	private async assertUniqueCodeAndName(
		input: { subscriptionCode?: string; subscriptionName?: string },
		excludeId?: string,
	): Promise<void> {
		const subscriptionCode = input.subscriptionCode?.trim();
		const subscriptionName = input.subscriptionName?.trim();

		if (!subscriptionCode && !subscriptionName) return;

		const qb = this.repo.createQueryBuilder("s");
		if (excludeId) {
			qb.where("s.id <> :excludeId", { excludeId });
		}

		qb.andWhere(
			new Brackets((subQb) => {
				if (subscriptionCode) {
					subQb.where("LOWER(s.subscriptionCode) = LOWER(:subscriptionCode)", {
						subscriptionCode,
					});
				}
				if (subscriptionName) {
					if (subscriptionCode) {
						subQb.orWhere(
							"LOWER(s.subscriptionName) = LOWER(:subscriptionName)",
							{ subscriptionName },
						);
					} else {
						subQb.where(
							"LOWER(s.subscriptionName) = LOWER(:subscriptionName)",
							{
								subscriptionName,
							},
						);
					}
				}
			}),
		);

		const existing = await qb.getOne();
		if (!existing) return;

		if (
			subscriptionCode &&
			existing.subscriptionCode?.toLowerCase() ===
				subscriptionCode.toLowerCase()
		) {
			throw new ConflictException("Subscription code already exists");
		}
		if (
			subscriptionName &&
			existing.subscriptionName?.toLowerCase() ===
				subscriptionName.toLowerCase()
		) {
			throw new ConflictException("Subscription name already exists");
		}
		throw new ConflictException("Subscription code or name already exists");
	}

	async createOne(dto: CreateSubscriptionRequest) {
		await this.assertUniqueCodeAndName({
			subscriptionCode: dto.subscriptionCode,
			subscriptionName: dto.subscriptionName,
		});

		const entity = this.repo.create({
			subscriptionCode: dto.subscriptionCode,
			subscriptionName: dto.subscriptionName,
			price: dto.price,
			limitMembers: dto.limitMembers,
			isAIActive: dto.isAIActive,
			runCodePerDay: dto.runCodePerDay,
			programmingLanguageInGroups: dto.programmingLanguageInGroups,
			levelSubscription: dto.levelSubscription,
			isActive: dto.isActive ?? true,
		});
		const saved = await this.repo.save(entity);
		return SubscriptionResponse.fromEntity(saved);
	}

	async findMany(query: SubscriptionQuery) {
		const entities = await this.repo.find({
			where:
				query?.isActive === undefined
					? undefined
					: { isActive: query.isActive },
		});
		return entities.map(SubscriptionResponse.fromEntity);
	}

	async findOne(id: string) {
		const entity = await this.repo.findOneByOrFail({ id });
		return SubscriptionResponse.fromEntity(entity);
	}

	async updateOne(id: string, dto: UpdateSubscriptionRequest) {
		const current = await this.repo.findOneByOrFail({ id });

		const codeChanged =
			dto.subscriptionCode !== undefined &&
			this.normalizeComparableText(dto.subscriptionCode) !==
				this.normalizeComparableText(current.subscriptionCode);
		const nameChanged =
			dto.subscriptionName !== undefined &&
			this.normalizeComparableText(dto.subscriptionName) !==
				this.normalizeComparableText(current.subscriptionName);

		// Business rule: if code/name unchanged, skip uniqueness validation.
		if (codeChanged || nameChanged) {
			await this.assertUniqueCodeAndName(
				{
					subscriptionCode: codeChanged ? dto.subscriptionCode : undefined,
					subscriptionName: nameChanged ? dto.subscriptionName : undefined,
				},
				id,
			);
		}

		const usedCount = await this.groupSubscriptionRepo.count({
			where: { subscriptionId: id },
		});
		const hasEntitlementChanges = this.hasEntitlementLikeChanges(current, dto);

		// Business rule: if subscription is already used by any group and entitlement-like
		// fields change, create a new subscription with incremented version.
		if (usedCount > 0 && hasEntitlementChanges) {
			const nextVersion = (current.version ?? 1) + 1;
			const newEntity = this.repo.create({
				subscriptionCode: dto.subscriptionCode ?? current.subscriptionCode,
				subscriptionName: dto.subscriptionName ?? current.subscriptionName,
				price: dto.price ?? current.price,
				limitMembers: dto.limitMembers ?? current.limitMembers,
				isAIActive: dto.isAIActive ?? current.isAIActive,
				runCodePerDay: dto.runCodePerDay ?? current.runCodePerDay,
				programmingLanguageInGroups:
					dto.programmingLanguageInGroups ??
					current.programmingLanguageInGroups,
				levelSubscription: dto.levelSubscription ?? current.levelSubscription,
				isActive: dto.isActive ?? current.isActive,
				version: nextVersion,
			});
			const saved = await this.repo.save(newEntity);
			await this.repo.update(id, { isActive: false });
			return SubscriptionResponse.fromEntity(saved);
		}

		await this.repo.update(id, dto);
		return this.findOne(id);
	}

	async deleteOne(id: string) {
		const now = new Date();
		const activeOrUnexpiredCount = await this.groupSubscriptionRepo
			.createQueryBuilder("gs")
			.where("gs.subscriptionId = :id", { id })
			.andWhere(
				new Brackets((qb) => {
					qb.where("gs.endedAt IS NULL").orWhere("gs.endedAt >= :now", { now });
				}),
			)
			.getCount();
		if (activeOrUnexpiredCount > 0) {
			throw new ConflictException(
				"Cannot delete subscription because it is currently used by one or more groups",
			);
		}
		await this.repo.delete(id);
	}
}
