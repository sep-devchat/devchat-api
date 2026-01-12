import {
	GroupEntitlementRepository,
	GroupRepository,
	GroupSubscriptionRepository,
	GroupUsageRepository,
	SubscriptionRepository,
	UserRepository,
} from "@db/repositories";
import { Injectable } from "@nestjs/common";
import { Env } from "@utils";
import { In } from "typeorm";
import { randomDateInSeedRange } from "../utils/seed-date.util";

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
export class GroupSubscriptionSeederService {
	private readonly FREE_PLAN_CODE = "FREE_00";

	constructor(
		private readonly userRepo: UserRepository,
		private readonly groupRepo: GroupRepository,
		private readonly subscriptionRepo: SubscriptionRepository,
		private readonly groupSubscriptionRepo: GroupSubscriptionRepository,
		private readonly groupEntitlementRepo: GroupEntitlementRepository,
		private readonly groupUsageRepo: GroupUsageRepository,
	) {}

	private async resolveSeederUserId(): Promise<string> {
		if (!Env.ADMIN_USER) {
			throw new Error("ADMIN_USER is not configured in the environment");
		}

		const seederUser = await this.userRepo.findOne({
			select: ["id"],
			where: { email: Env.ADMIN_USER },
		});

		if (!seederUser) {
			throw new Error(
				`Cannot seed group subscriptions because user ${Env.ADMIN_USER} was not found`,
			);
		}

		return seederUser.id;
	}

	private async ensureFreeSubscriptionId(): Promise<string> {
		const existing = await this.subscriptionRepo.findOne({
			where: { subscriptionCode: this.FREE_PLAN_CODE },
			order: { isActive: "DESC", version: "DESC" },
		});
		if (existing?.id) return existing.id;

		const created = await this.subscriptionRepo.save(
			this.subscriptionRepo.create({
				subscriptionCode: this.FREE_PLAN_CODE,
				subscriptionName: "Free Plan",
				price: 0,
				limitMembers: 5,
				isAIActive: false,
				runCodePerDay: 50,
				programmingLanguageInGroups: 1,
				levelSubscription: 0,
				isActive: true,
				version: 1,
			}),
		);
		return created.id;
	}

	async run() {
		console.log("Seeding group subscriptions...");

		const [seederUserId, freeSubscriptionId] = await Promise.all([
			this.resolveSeederUserId(),
			this.ensureFreeSubscriptionId(),
		]);

		const activeGroups = await this.groupRepo.find({
			select: { id: true },
			where: { isActive: true },
		});
		if (!activeGroups.length) {
			console.warn(
				"No active groups found; skipping group subscription seeding.",
			);
			return;
		}

		const groupIds = activeGroups.map((g) => g.id);

		// 1) Ensure every active group has at least one group_subscription record (FREE_00).
		const existingForFree = await this.groupSubscriptionRepo.find({
			select: ["groupId"],
			where: { groupId: In(groupIds), subscriptionId: freeSubscriptionId },
		});
		const hasFree = new Set(existingForFree.map((s) => s.groupId));
		const missingFreeGroupIds = groupIds.filter((id) => !hasFree.has(id));

		if (missingFreeGroupIds.length) {
			const startedAt = randomDateInSeedRange();
			await this.groupSubscriptionRepo.insert(
				missingFreeGroupIds.map((groupId) =>
					this.groupSubscriptionRepo.create({
						groupId,
						subscriptionId: freeSubscriptionId,
						groupSubscriptionStatus: "active",
						monthQuantity: 1,
						remainDays: 0,
						paymentBy: null,
						isPaid: false,
						startedAt,
						endedAt: null,
					}),
				),
			);
			console.log(
				`Inserted ${missingFreeGroupIds.length} missing FREE_00 group subscription records.`,
			);
		} else {
			console.log(
				"All active groups already have a FREE_00 subscription record.",
			);
		}

		// 2) Backfill entitlement snapshots for all existing group_subscription rows.
		// Runtime checks (run-code limits) depend on group_entitlement.
		const allGroupSubs = await this.groupSubscriptionRepo.find({
			where: { groupId: In(groupIds) },
		});
		if (!allGroupSubs.length) {
			console.warn(
				"No group subscriptions found; skipping entitlement backfill.",
			);
			return;
		}

		const subscriptionIds = Array.from(
			new Set(allGroupSubs.map((s) => String(s.subscriptionId))),
		);
		const subscriptions = await this.subscriptionRepo.find({
			where: { id: In(subscriptionIds) },
		});
		const subscriptionById = new Map(
			subscriptions.map((s) => [String(s.id), s]),
		);

		const existingEntitlements = await this.groupEntitlementRepo.find({
			where: { groupId: In(groupIds) },
			select: ["groupId", "subscriptionId", "effectiveFrom", "effectiveTo"],
		});
		const entitlementKeys = new Set(
			existingEntitlements.map(
				(e) =>
					`${e.groupId}|${e.subscriptionId ?? ""}|${e.effectiveFrom.toISOString()}|${e.effectiveTo ? e.effectiveTo.toISOString() : ""}`,
			),
		);

		const entitlementToInsert = [] as any[];
		for (const gs of allGroupSubs) {
			const sub = subscriptionById.get(String(gs.subscriptionId));
			if (!sub) continue;

			const effectiveFrom = gs.startedAt ?? new Date();
			const effectiveTo = gs.endedAt ?? null;
			const key = `${gs.groupId}|${gs.subscriptionId}|${effectiveFrom.toISOString()}|${effectiveTo ? effectiveTo.toISOString() : ""}`;
			if (entitlementKeys.has(key)) continue;

			entitlementToInsert.push(
				this.groupEntitlementRepo.create({
					groupId: String(gs.groupId),
					effectiveFrom,
					effectiveTo,
					source: "migration",
					subscriptionId: String(gs.subscriptionId),
					entitlements: {
						features: { ai: Boolean(sub.isAIActive) },
						limits: {
							members: Number(sub.limitMembers ?? 0),
							runCodePerDay: Number(sub.runCodePerDay ?? 0),
							programmingLanguagesInGroups: Number(
								sub.programmingLanguageInGroups ?? 0,
							),
						},
					},
					createdBy: seederUserId,
				}),
			);
		}

		if (entitlementToInsert.length) {
			await this.groupEntitlementRepo.insert(entitlementToInsert);
			console.log(
				`Inserted ${entitlementToInsert.length} group entitlement snapshot records.`,
			);
		} else {
			console.log("No missing entitlement snapshots found.");
		}

		// 3) Ensure current-cycle group_usage rows exist (counters start at 0).
		const now = new Date();
		const billingCycleKey = billingCycleKeyOf(now);
		const { start: periodStart, end: periodEnd } = monthBoundsUtc(now);

		const existingUsage = await this.groupUsageRepo.find({
			select: ["groupId"],
			where: { billingCycleKey, groupId: In(groupIds) },
		});
		const existingUsageGroupIds = new Set(existingUsage.map((u) => u.groupId));
		const missingUsageGroupIds = groupIds.filter(
			(id) => !existingUsageGroupIds.has(id),
		);

		if (missingUsageGroupIds.length) {
			await this.groupUsageRepo.insert(
				missingUsageGroupIds.map((groupId) =>
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
			console.log(
				`Inserted ${missingUsageGroupIds.length} missing group usage rows for ${billingCycleKey}.`,
			);
		} else {
			console.log(
				`All active groups already have usage rows for ${billingCycleKey}.`,
			);
		}
	}
}
