import { ShareFundEntity } from "@db/entities";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { GroupResponse } from "@modules/group/dto";
import { SubscriptionResponse } from "@modules/subscription/dto";

export class ShareFundInGroupResponse {
	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Share fund ID",
	})
	id: string;

	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Group ID",
	})
	groupId: string;

	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Subscription ID",
	})
	subscriptionId: string;

	@ApiProperty({
		example: 1,
		description: "Number of months this share fund is intended to purchase",
	})
	monthQuantity: number;

	@ApiPropertyOptional({
		example: "Basic Plan fund",
		description: "Fund name",
		nullable: true,
	})
	fundName: string | null;

	@ApiPropertyOptional({
		example: 10,
		description:
			"Max number of donation transactions allowed for this fund. Null means unlimited.",
		nullable: true,
	})
	contributeTime: number | null;

	@ApiProperty({
		example: "100000",
		description: "Current VND amount as a string to preserve precision",
	})
	currentVndAmount: string;

	@ApiProperty({
		example: "2024-01-01T00:00:00.000Z",
		description: "Creation date",
	})
	createdAt: Date;

	@ApiProperty({
		example: "2024-01-01T00:00:00.000Z",
		description: "Last update date",
	})
	updatedAt: Date;

	@ApiPropertyOptional({
		type: () => GroupResponse,
		description: "Group details",
		nullable: true,
	})
	group: GroupResponse | null;

	@ApiPropertyOptional({
		type: () => SubscriptionResponse,
		description: "Subscription details",
		nullable: true,
	})
	subscription: SubscriptionResponse | null;

	static fromEntity(entity: ShareFundEntity): ShareFundInGroupResponse {
		return {
			id: entity.id,
			groupId: entity.groupId,
			subscriptionId: entity.subscriptionId,
			monthQuantity: entity.monthQuantity ?? 1,
			fundName: entity.fundName,
			contributeTime: entity.contributeTime,
			currentVndAmount: entity.currentVndAmount,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			group: entity.group ? GroupResponse.fromEntity(entity.group) : null,
			subscription: entity.subscription
				? SubscriptionResponse.fromEntity(entity.subscription)
				: null,
		};
	}

	static fromEntities(entities: ShareFundEntity[]): ShareFundInGroupResponse[] {
		return entities.map((entity) => this.fromEntity(entity));
	}
}
