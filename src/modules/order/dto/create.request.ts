import { ApiProperty } from "@nestjs/swagger";

export class CreateOrderRequest {
	@ApiProperty({ example: "group-uuid" })
	groupId: string;

	@ApiProperty({ example: "subscription-uuid" })
	subscriptionId: string;
}
