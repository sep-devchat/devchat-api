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

	private async generateDuplicateIdentity(input: {
		subscriptionCode: string;
		subscriptionName: string;
	}): Promise<{ subscriptionCode: string; subscriptionName: string }> {
		const codeBase = String(input.subscriptionCode ?? "").trim();
		const nameBase = String(input.subscriptionName ?? "").trim();
		if (!codeBase || !nameBase) {
			throw new ConflictException(
				"Cannot duplicate subscription without code/name",
			);
		}

		const normalizeCopyCode = (
			raw: string,
		): { prefix: string; start: number } => {
			// Rules:
			// - If code already ends with _COPY or _COPY_<n>, increment index: BASIC_COPY -> BASIC_COPY_2, BASIC_COPY_3...
			// - If code contains COPY elsewhere, just append _2, _3...
			// - Otherwise, append _COPY (then _COPY_2, _COPY_3...)
			const trimmed = String(raw ?? "").trim();
			const copySuffix = trimmed.match(/^(.*?_COPY)(?:_(\d+))?$/i);
			if (copySuffix) {
				const basePrefix = copySuffix[1];
				const n = copySuffix[2] ? Number(copySuffix[2]) : undefined;
				const start = Number.isFinite(n) && n ? n + 1 : 2;
				return { prefix: basePrefix, start };
			}
			if (/copy/i.test(trimmed)) {
				return { prefix: trimmed, start: 2 };
			}
			return { prefix: `${trimmed}_COPY`, start: 1 };
		};

		const normalizeCopyName = (
			raw: string,
		): { baseName: string; start: number; alreadyCopied: boolean } => {
			// If name already ends with "(Copy)" or "(Copy n)", increment index.
			const trimmed = String(raw ?? "").trim();
			const copySuffix = trimmed.match(/^(.*)\s+\(Copy(?:\s+(\d+))?\)\s*$/i);
			if (copySuffix) {
				const baseName = String(copySuffix[1] ?? "").trim();
				const n = copySuffix[2] ? Number(copySuffix[2]) : undefined;
				const start = Number.isFinite(n) && n ? n + 1 : 2;
				return { baseName, start, alreadyCopied: true };
			}
			return { baseName: trimmed, start: 1, alreadyCopied: false };
		};

		const codeRule = normalizeCopyCode(codeBase);
		const nameRule = normalizeCopyName(nameBase);

		for (let offset = 0; offset < 50; offset += 1) {
			const codeIndex = codeRule.start + offset;
			const subscriptionCode =
				codeRule.start === 1 && codeIndex === 1
					? codeRule.prefix
					: `${codeRule.prefix}_${codeIndex}`;

			const nameIndex = nameRule.start + offset;
			const subscriptionName = nameRule.alreadyCopied
				? `${nameRule.baseName} (Copy ${nameIndex})`
				: nameIndex === 1
					? `${nameRule.baseName} (Copy)`
					: `${nameRule.baseName} (Copy ${nameIndex})`;

			const existing = await this.repo
				.createQueryBuilder("s")
				.where("LOWER(s.subscriptionCode) = LOWER(:subscriptionCode)", {
					subscriptionCode,
				})
				.orWhere("LOWER(s.subscriptionName) = LOWER(:subscriptionName)", {
					subscriptionName,
				})
				.getOne();

			if (!existing) {
				return { subscriptionCode, subscriptionName };
			}
		}

		throw new ConflictException(
			"Cannot generate unique code/name for duplicated subscription",
		);
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
		const where: { isActive?: boolean; isAIActive?: boolean } = {};
		if (query?.isActive !== undefined) where.isActive = query.isActive;
		if (query?.isAIActive !== undefined) where.isAIActive = query.isAIActive;

		const entities = await this.repo.find({
			where: Object.keys(where).length ? where : undefined,
			order: query?.sortBy
				? ({
						[query.sortBy]: (query.sortOrder ?? "ASC") as "ASC" | "DESC",
					} as Record<string, "ASC" | "DESC">)
				: undefined,
		});

		if (entities.length === 0) return [];

		const ids = entities.map((e) => e.id);
		const usedRows = await this.groupSubscriptionRepo
			.createQueryBuilder("gs")
			.select("gs.subscriptionId", "subscriptionId")
			.addSelect("COUNT(1)", "usedCount")
			.where("gs.subscriptionId IN (:...ids)", { ids })
			.groupBy("gs.subscriptionId")
			.getRawMany<{ subscriptionId: string; usedCount: string }>();

		const usedCountById = new Map<string, number>();
		for (const row of usedRows) {
			usedCountById.set(row.subscriptionId, Number(row.usedCount) || 0);
		}

		return entities.map((entity) =>
			SubscriptionResponse.fromEntity(entity, {
				isAllowDelete: (usedCountById.get(entity.id) ?? 0) === 0,
			}),
		);
	}

	async findOne(id: string) {
		const entity = await this.repo.findOneByOrFail({ id });
		return SubscriptionResponse.fromEntity(entity);
	}

	async duplicateOne(id: string) {
		const current = await this.repo.findOneByOrFail({ id });
		const identity = await this.generateDuplicateIdentity({
			subscriptionCode: current.subscriptionCode,
			subscriptionName: current.subscriptionName,
		});

		const entity = this.repo.create({
			subscriptionCode: identity.subscriptionCode,
			subscriptionName: identity.subscriptionName,
			price: current.price,
			limitMembers: current.limitMembers,
			isAIActive: current.isAIActive,
			runCodePerDay: current.runCodePerDay,
			programmingLanguageInGroups: current.programmingLanguageInGroups,
			levelSubscription: current.levelSubscription,
			isActive: current.isActive,
			version: 1,
		});

		const saved = await this.repo.save(entity);
		return SubscriptionResponse.fromEntity(saved, { isAllowDelete: true });
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
