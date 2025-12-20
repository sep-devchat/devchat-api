import { TransactionEntity } from "@db/entities";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { GroupResponse } from "@modules/group/dto";
import { ShareFundInGroupResponse } from "@modules/share-fund/dto";
import { SubscriptionResponse } from "@modules/subscription/dto";
import { UserResponse } from "@modules/user/dto/user.response";

export class TransactionResponse {
	@ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
	id: string;

	@ApiProperty({
		example: "150000",
		description: "Amount in VND as string to preserve precision",
	})
	vndAmount: string;

	@ApiPropertyOptional({
		example: "Payment for group subscription",
		nullable: true,
	})
	transactionMessage: string | null;

	@ApiProperty({ example: "VNPAY" })
	paymentMethod: string;

	@ApiProperty({ example: "SUCCESS" })
	transactionStatus: string;

	@ApiProperty({ example: "SUBSCRIPTION" })
	transactionType: string;

	@ApiProperty({ example: "1734546420000_user-uuid" })
	transactionCode: string;

	@ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440001" })
	userId: string;

	@ApiPropertyOptional({
		example: "550e8400-e29b-41d4-a716-446655440002",
		nullable: true,
	})
	groupId: string | null;

	@ApiPropertyOptional({
		example: "550e8400-e29b-41d4-a716-446655440003",
		nullable: true,
	})
	shareFundId: string | null;

	@ApiPropertyOptional({
		example: "550e8400-e29b-41d4-a716-446655440004",
		nullable: true,
	})
	subscriptionId: string | null;

	@ApiProperty({ example: "2025-12-18T00:00:00.000Z" })
	createdAt: Date;

	@ApiPropertyOptional({
		type: () => UserResponse,
		nullable: true,
		description: "User details (present when relation is loaded)",
	})
	user: UserResponse | null;

	@ApiPropertyOptional({
		type: () => GroupResponse,
		nullable: true,
		description: "Group details (present when relation is loaded)",
	})
	group: GroupResponse | null;

	@ApiPropertyOptional({
		type: () => ShareFundInGroupResponse,
		nullable: true,
		description: "Share fund details (present when relation is loaded)",
	})
	shareFund: ShareFundInGroupResponse | null;

	@ApiPropertyOptional({
		type: () => SubscriptionResponse,
		nullable: true,
		description: "Subscription details (present when relation is loaded)",
	})
	subscription: SubscriptionResponse | null;

	static fromEntity(entity: TransactionEntity): TransactionResponse {
		return {
			id: entity.id,
			vndAmount: entity.vndAmount,
			transactionMessage: entity.transactionMessage ?? null,
			paymentMethod: entity.paymentMethod,
			transactionStatus: entity.transactionStatus,
			transactionType: entity.transactionType,
			transactionCode: entity.transactionCode,
			userId: entity.userId,
			groupId: entity.groupId ?? null,
			shareFundId: entity.shareFundId ?? null,
			subscriptionId: entity.subscriptionId ?? null,
			createdAt: entity.createdAt,
			user: entity.user ? UserResponse.fromEntity(entity.user) : null,
			group: entity.group ? GroupResponse.fromEntity(entity.group) : null,
			shareFund: entity.shareFund
				? ShareFundInGroupResponse.fromEntity(entity.shareFund)
				: null,
			subscription: entity.subscription
				? SubscriptionResponse.fromEntity(entity.subscription)
				: null,
		};
	}

	static fromEntities(entities: TransactionEntity[]): TransactionResponse[] {
		return entities.map((e) => this.fromEntity(e));
	}
}
