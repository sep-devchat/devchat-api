import { ApiProperty } from "@nestjs/swagger";
import {
	IsBoolean,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
} from "class-validator";

export class CreateSubscriptionRequest {
	@ApiProperty({
		example: "SUB_BASIC",
		description: "Unique code used to identify the subscription plan",
	})
	@IsString()
	@MaxLength(50)
	@IsNotEmpty()
	subscriptionCode: string;

	@ApiProperty({
		example: "Basic Plan",
		description: "Human readable plan name",
	})
	@IsString()
	@MaxLength(100)
	@IsNotEmpty()
	subscriptionName: string;

	@ApiProperty({
		example: 99000,
		description: "Price in VND",
	})
	@IsNumber()
	@IsNotEmpty()
	price: number;

	@ApiProperty({
		example: 10,
		description: "Maximum number of members allowed for this subscription",
	})
	@IsNumber()
	limitMembers: number;

	@ApiProperty({
		example: true,
		description: "Flag to indicate whether AI features are enabled",
	})
	@IsBoolean()
	isAIActive: boolean;

	@ApiProperty({
		example: 100,
		description: "Maximum run-code executions per day",
	})
	@IsNumber()
	runCodePerDay: number;

	@ApiProperty({
		example: 5,
		description: "Number of programming languages allowed in groups",
	})
	@IsNumber()
	programmingLanguageInGroups: number;

	@ApiProperty({
		example: true,
		required: false,
		default: true,
		description:
			"Whether the subscription is active and available for purchase",
	})
	@IsBoolean()
	@IsOptional()
	isActive?: boolean;

	@ApiProperty({
		example: 1,
		description: "Subscription level number used for grouping plans",
	})
	@IsNumber()
	levelSubscription: number;
}
