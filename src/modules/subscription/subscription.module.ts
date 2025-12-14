import { Module } from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionStartupSeeder } from "./subscription.startup-seeder";

@Module({
	providers: [SubscriptionService, SubscriptionStartupSeeder],
	exports: [SubscriptionService],
	controllers: [SubscriptionController],
})
export class SubscriptionModule {}
