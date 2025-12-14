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

	@ApiProperty({ example: true })
	allowUseAI: boolean;

	@ApiProperty({ example: 1 })
	levelSubscription: number;
}
