import { ApiProperty } from "@nestjs/swagger";
import {
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Max,
	Min,
} from "class-validator";

export class CreatePaymentRequest {
	@ApiProperty({ example: 150000, description: "Amount in VND" })
	@IsNumber()
	@Min(1)
	amount: number;

	@ApiProperty({ example: 1, description: "Subscription duration in months" })
	@IsInt()
	@Min(1)
	@Max(120)
	monthQuantity: number;

	@ApiProperty({ required: false, example: "127.0.0.1" })
	@IsString()
	@IsOptional()
	ipAddr?: string;

	@ApiProperty({ example: "2d4f1c0a-9a0e-4f4d-9c6f-1234567890ab" })
	@IsUUID()
	groupId: string;

	@ApiProperty({ example: "tier" })
	subscriptionId: string;

	@ApiProperty({
		required: false,
		deprecated: true,
		example: "2d4f1c0a-9a0e-4f4d-9c6f-1234567890ab",
		description:
			"Deprecated. Order information is now derived from groupId/subscriptionId and the authenticated user.",
	})
	@IsString()
	@IsOptional()
	userId?: string;

	@ApiProperty({
		required: false,
		example: "2d4f1c0a-9a0e-4f4d-9c6f-1234567890ab",
		description: "Share fund ID if paying via a share fund.",
	})
	@IsString()
	@IsOptional()
	shareFundId?: string;

	@ApiProperty({
		required: false,
		example: "SUBSCRIPTION",
		description: "The transaction type.",
	})
	@IsString()
	@IsOptional()
	transactionType?: string;
}
