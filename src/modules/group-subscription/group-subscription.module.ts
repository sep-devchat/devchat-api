import { Module } from "@nestjs/common";
import { GroupSubscriptionService } from "./group-subscription.service";
import { GroupSubscriptionController } from "./group-subscription.controller";

@Module({
	providers: [GroupSubscriptionService],
	exports: [GroupSubscriptionService],
	controllers: [GroupSubscriptionController],
})
export class GroupSubscriptionModule {}
