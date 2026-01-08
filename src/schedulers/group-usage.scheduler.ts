import { GroupRepository, GroupUsageRepository } from "@db/repositories";
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

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
export class GroupUsageScheduler {
	private readonly logger = new Logger(GroupUsageScheduler.name);

	constructor(
		private readonly groupRepo: GroupRepository,
		private readonly groupUsageRepo: GroupUsageRepository,
	) {}

	/**
	 * Daily reset of group usage counters.
	 *
	 * - Runs at 00:00 (midnight).
	 * - Resets counters for the current billing-cycle row.
	 * - Ensures every active group has a usage row for the current cycle.
	 */
	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async resetGroupUsageDaily() {
		const now = new Date();
		const billingCycleKey = billingCycleKeyOf(now);
		const { start: periodStart, end: periodEnd } = monthBoundsUtc(now);

		try {
			// 1) Reset counters for all existing usage rows in the current cycle.
			await this.groupUsageRepo
				.createQueryBuilder()
				.update()
				.set({
					periodStart,
					periodEnd,
					messagesSent: 0,
					fileBytesUploaded: "0",
					runCodeExecutions: 0,
					aiTokensConsumed: "0",
				})
				.where("billingCycleKey = :billingCycleKey", { billingCycleKey })
				.execute();

			// 2) Ensure each active group has a usage row for the current cycle.
			const activeGroups = await this.groupRepo.find({
				select: { id: true },
				where: { isActive: true },
			});
			if (!activeGroups.length) return;

			const existing = await this.groupUsageRepo.find({
				select: { groupId: true },
				where: { billingCycleKey },
			});
			const existingGroupIds = new Set(existing.map((u) => u.groupId));

			const missing = activeGroups
				.map((g) => g.id)
				.filter((groupId) => !existingGroupIds.has(groupId));
			if (!missing.length) return;

			await this.groupUsageRepo.insert(
				missing.map((groupId) =>
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
				),
			);

			this.logger.log(
				`Reset usage for cycle ${billingCycleKey}; inserted ${missing.length} missing usage rows.`,
			);
		} catch (err: any) {
			this.logger.error(
				`Failed to reset group usage: ${err?.message ?? String(err)}`,
				err?.stack,
			);
		}
	}
}
