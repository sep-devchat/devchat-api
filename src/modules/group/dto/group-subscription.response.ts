import { ApiProperty } from "@nestjs/swagger";
import { GroupSubscriptionResponse } from "@modules/group-subscription/dto";
import { GroupEntitlementResponse } from "@modules/group/dto/group-entitlement.response";
import { GroupUsageResponse } from "@modules/group/dto/group-usage.response";

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

	@ApiProperty({
		required: false,
		nullable: true,
		type: () => GroupEntitlementResponse,
		description: "Current effective entitlement snapshot for this group",
	})
	currentEntitlement: GroupEntitlementResponse | null;

	@ApiProperty({
		required: false,
		nullable: true,
		type: () => GroupUsageResponse,
		description: "Current billing-cycle usage counters for this group",
	})
	usage: GroupUsageResponse | null;
}
