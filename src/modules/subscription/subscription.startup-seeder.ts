import { SubscriptionRepository } from "@db/repositories";
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { In } from "typeorm";

type SeedSubscription = {
	subscriptionCode: string;
	subscriptionName: string;
	price: number;
	limitMembers: number;
	isAIActive: boolean;
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
				subscriptionCode: "FREE",
				subscriptionName: "Free Plan",
				price: 0,
				limitMembers: 5,
				isAIActive: false,
				runCodePerDay: 50,
				programmingLanguageInGroups: 1,
				levelSubscription: 0,
			},
			{
				subscriptionCode: "BASIC",
				subscriptionName: "Basic Plan",
				price: 50000,
				limitMembers: 50,
				isAIActive: true,
				runCodePerDay: 1000,
				programmingLanguageInGroups: 5,
				levelSubscription: 1,
			},
			{
				subscriptionCode: "STANDARD",
				subscriptionName: "Standard Plan",
				price: 300000,
				limitMembers: 300,
				isAIActive: true,
				runCodePerDay: 9000,
				programmingLanguageInGroups: -1,
				levelSubscription: 2,
			},
		];

		try {
			const codes = seeds.map((s) => s.subscriptionCode);
			const existingByCode = await this.repo.findBy({
				subscriptionCode: In(codes),
			});
			const existingCodes = new Set(
				existingByCode.map((s) => s.subscriptionCode),
			);

			// Seed only missing subscription codes.
			// Do NOT update existing rows here (admins can update price and we shouldn't overwrite it on restart).
			const toInsert = seeds.filter(
				(s) => !existingCodes.has(s.subscriptionCode),
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
