import { SubscriptionRepository } from "@db/repositories";
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { In } from "typeorm";

type SeedSubscription = {
	id: string;
	subscriptionCode: string;
	subscriptionName: string;
	price: number;
	limitMembers: number;
	isAIActive: boolean;
	allowUseAI: boolean;
	runCodePerDay: number;
	programmingLanguageInGroups: number;
	levelSubscription: number;
};

@Injectable()
export class SubscriptionStartupSeeder implements OnApplicationBootstrap {
	private readonly logger = new Logger(SubscriptionStartupSeeder.name);

	constructor(private readonly repo: SubscriptionRepository) {}

	async onApplicationBootstrap() {
		const seeds: SeedSubscription[] = [
			{
				id: "free-001",
				subscriptionCode: "FREE_00",
				subscriptionName: "Free Plan",
				price: 0,
				limitMembers: 5,
				isAIActive: false,
				allowUseAI: false,
				runCodePerDay: 50,
				programmingLanguageInGroups: 1,
				levelSubscription: 0,
			},
			{
				id: "tier1-001",
				subscriptionCode: "TIER_01",
				subscriptionName: "Tier 1 Plan",
				price: 50000,
				limitMembers: 50,
				isAIActive: true,
				allowUseAI: true,
				runCodePerDay: 1000,
				programmingLanguageInGroups: 5,
				levelSubscription: 1,
			},
			{
				id: "tier2-001",
				subscriptionCode: "TIER_02",
				subscriptionName: "Tier 2 Plan",
				price: 300000,
				limitMembers: 300,
				isAIActive: true,
				allowUseAI: true,
				runCodePerDay: 9000,
				programmingLanguageInGroups: -1,
				levelSubscription: 2,
			},
		];

		try {
			const ids = seeds.map((s) => s.id);
			const codes = seeds.map((s) => s.subscriptionCode);

			const existingById = await this.repo.findBy({ id: In(ids) });
			const existingByCode = await this.repo.findBy({
				subscriptionCode: In(codes),
			});

			const existingIds = new Set(existingById.map((s) => s.id));
			const existingCodes = new Set(
				existingByCode.map((s) => s.subscriptionCode),
			);

			const toInsert = seeds.filter(
				(s) => !existingIds.has(s.id) && !existingCodes.has(s.subscriptionCode),
			);

			if (!toInsert.length) {
				this.logger.log("Default subscriptions already exist. Skipping.");
				return;
			}

			await this.repo.save(toInsert.map((s) => this.repo.create(s)));
			this.logger.log(`Seeded ${toInsert.length} default subscriptions.`);
		} catch (err: any) {
			this.logger.error(
				`Failed seeding default subscriptions: ${err?.message ?? String(err)}`,
				err?.stack,
			);
		}
	}
}
