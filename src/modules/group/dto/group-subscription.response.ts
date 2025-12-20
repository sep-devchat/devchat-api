import { ApiProperty } from "@nestjs/swagger";
import { GroupSubscriptionResponse } from "@modules/group-subscription/dto";

export class GroupSubscriptionsInGroupResponse {
	@ApiProperty({
		required: false,
		nullable: true,
		type: () => GroupSubscriptionResponse,
		description: "Current/active subscription of this group",
	})
	currentSubscription: GroupSubscriptionResponse | null;

	@ApiProperty({
		required: true,
		type: () => GroupSubscriptionResponse,
		isArray: true,
		description: "All subscriptions that this group has (history)",
	})
	subscriptions: GroupSubscriptionResponse[];
}
