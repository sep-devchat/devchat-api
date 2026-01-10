import { GroupEntitlementRepository, GroupRepository } from "@db/repositories";
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Brackets } from "typeorm";

@Injectable()
export class GroupEntitlementScheduler {
	private readonly logger = new Logger(GroupEntitlementScheduler.name);

	constructor(
		private readonly groupRepo: GroupRepository,
		private readonly groupEntitlementRepo: GroupEntitlementRepository,
	) {}

	/**
	 * Keeps group_entitlement.isCurrent in sync with effectiveFrom/effectiveTo.
	 *
	 * Consumers should prefer reading `isCurrent=true` for the current entitlement.
	 * This scheduler ensures the flag transitions as time passes.
	 */
	@Cron(CronExpression.EVERY_5_MINUTES)
	async syncCurrentEntitlements() {
		const now = new Date();
		try {
			const activeGroups = await this.groupRepo.find({
				select: { id: true },
				where: { isActive: true },
			});
			if (!activeGroups.length) return;

			let changed = 0;
			for (const g of activeGroups) {
				const groupId = String(g.id);

				const byTime = await this.groupEntitlementRepo
					.createQueryBuilder("ge")
					.where("ge.groupId = :groupId", { groupId })
					.andWhere("ge.effectiveFrom <= :now", { now })
					.andWhere(
						new Brackets((qb) => {
							qb.where("ge.effectiveTo IS NULL").orWhere(
								"ge.effectiveTo > :now",
								{ now },
							);
						}),
					)
					.orderBy("ge.effectiveFrom", "DESC")
					.getOne();

				if (!byTime) continue;
				if (byTime.isCurrent) continue;

				await this.groupEntitlementRepo.update(
					{ groupId, isCurrent: true },
					{ isCurrent: false },
				);
				await this.groupEntitlementRepo.update(byTime.id, { isCurrent: true });
				changed += 1;
			}

			if (changed) {
				this.logger.log(`Synced current entitlements for ${changed} groups.`);
			}
		} catch (err: any) {
			this.logger.error(
				`Failed syncing current entitlements: ${err?.message ?? String(err)}`,
				err?.stack,
			);
		}
	}
}
