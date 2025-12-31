import { OrderEntity } from "@db/entities";
import { GroupSubscriptionResponse } from "@modules/group-subscription/dto";
import { GroupResponse } from "@modules/group/dto";
import { SubscriptionResponse } from "@modules/subscription/dto";
import { TransactionResponse } from "@modules/transaction/dto";
import { ApiProperty } from "@nestjs/swagger";

export class OrderResponse {
	@ApiProperty({ example: "order-uuid" })
	id: string;

	@ApiProperty({ example: "PENDING" })
	orderStatus: string;

	@ApiProperty({ example: "ORD-12345" })
	orderCode: string;

	@ApiProperty({ example: "group-uuid" })
	groupId: string;

	@ApiProperty({ example: "subscription-uuid" })
	subscriptionId: string;

	@ApiProperty({ example: 3 })
	monthQuantity: number;

	@ApiProperty({ example: "user-uuid | username" })
	paymentBy: string;

	@ApiProperty({ example: "2024-01-01T00:00:00Z" })
	createdAt: Date;

	@ApiProperty({ example: "user-uuid" })
	createdBy: string;

	group: GroupResponse;
	subscription: SubscriptionResponse;
	orderTransactions?: TransactionResponse[];

	static fromEntity(entity: OrderEntity): OrderResponse {
		return {
			id: entity.id,
			orderStatus: entity.orderStatus,
			orderCode: entity.orderCode,
			groupId: entity.groupId,
			subscriptionId: entity.subscriptionId,
			monthQuantity: entity.monthQuantity,
			paymentBy: entity.paymentBy,
			createdAt: entity.createdAt,
			createdBy: entity.createdBy,
			group: GroupResponse.fromEntity(entity.group),
			subscription: SubscriptionResponse.fromEntity(entity.subscription),
			orderTransactions: entity.orderTransactions
				? TransactionResponse.fromEntities(entity.orderTransactions)
				: [],
		};
	}

	static fromEntities(entities: OrderEntity[]): OrderResponse[] {
		return entities.map((e) => this.fromEntity(e));
	}
}
