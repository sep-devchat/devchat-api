import { GroupSubscriptionEntity } from "@db/entities";
import { SubscriptionResponse } from "@modules/subscription/dto";
import { ApiProperty } from "@nestjs/swagger";

export class GroupSubscriptionResponse {
	@ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
	id: string;

	@ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
	groupId: string;

	@ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
	subscriptionId: string;

	@ApiProperty({ example: "active", maxLength: 50 })
	groupSubscriptionStatus: string;

	@ApiProperty({ example: 1, minimum: 1 })
	monthQuantity: number;

	@ApiProperty({
		example: "vnpay",
		required: false,
		nullable: true,
		maxLength: 50,
	})
	paymentBy: string | null;

	@ApiProperty({ example: true })
	isPaid: boolean;

	@ApiProperty({
		required: false,
		nullable: true,
		example: "2024-08-01T00:00:00.000Z",
	})
	startedAt: Date | null;

	@ApiProperty({
		required: false,
		nullable: true,
		example: "2024-09-01T00:00:00.000Z",
	})
	endedAt: Date | null;

	@ApiProperty({
		required: false,
		nullable: true,
		type: () => SubscriptionResponse,
	})
	subscription?: SubscriptionResponse | null;

	static fromEntity(
		entity: GroupSubscriptionEntity,
	): GroupSubscriptionResponse {
		return {
			id: entity.id,
			groupId: entity.groupId,
			subscriptionId: entity.subscriptionId,
			groupSubscriptionStatus: entity.groupSubscriptionStatus,
			monthQuantity: entity.monthQuantity,
			paymentBy: entity.paymentBy,
			isPaid: entity.isPaid,
			startedAt: entity.startedAt,
			endedAt: entity.endedAt,
			subscription: entity.subscription
				? SubscriptionResponse.fromEntity(entity.subscription)
				: null,
		};
	}

	static fromEntities(
		entities: GroupSubscriptionEntity[],
	): GroupSubscriptionResponse[] {
		return entities.map((e) => this.fromEntity(e));
	}
}
