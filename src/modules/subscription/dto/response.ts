import { SubscriptionEntity } from "@db/entities/subscription.entity";
import { ApiProperty } from "@nestjs/swagger";

export class SubscriptionResponse {
	@ApiProperty({ example: "d9e3f1e8-1234-4bcd-9aef-abcdef123456" })
	id: string;

	@ApiProperty({ example: "SUB_BASIC" })
	subscriptionCode: string;

	@ApiProperty({ example: "Basic Plan" })
	subscriptionName: string;

	@ApiProperty({
		example: 99000,
		description: "Price in VND",
	})
	price: number;

	@ApiProperty({ example: 10 })
	limitMembers: number;

	@ApiProperty({ example: true })
	isAIActive: boolean;

	@ApiProperty({ example: 100 })
	runCodePerDay: number;

	@ApiProperty({ example: 5 })
	programmingLanguageInGroups: number;

	@ApiProperty({ example: 1 })
	levelSubscription: number;

	@ApiProperty({ example: 1 })
	version: number;

	@ApiProperty({ example: true })
	isActive: boolean;

	@ApiProperty({
		example: true,
		description:
			"Whether this subscription can be deleted. False when any group has used it.",
	})
	isAllowDelete: boolean;

	static fromEntity(
		entity: SubscriptionEntity,
		options?: { isAllowDelete?: boolean },
	): SubscriptionResponse {
		return {
			id: entity.id,
			subscriptionCode: entity.subscriptionCode,
			subscriptionName: entity.subscriptionName,
			price: entity.price,
			limitMembers: entity.limitMembers,
			isAIActive: entity.isAIActive,
			runCodePerDay: entity.runCodePerDay,
			programmingLanguageInGroups: entity.programmingLanguageInGroups,
			levelSubscription: entity.levelSubscription,
			version: entity.version,
			isActive: entity.isActive,
			isAllowDelete: options?.isAllowDelete ?? true,
		};
	}
}
