import { ApiProperty } from "@nestjs/swagger";
import {
	IsBoolean,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	Min,
} from "class-validator";

export class CreateGroupSubscriptionRequest {
	@ApiProperty({ example: "2d4f1c0a-9a0e-4f4d-9c6f-1234567890ab" })
	@IsUUID()
	groupId: string;

	@ApiProperty({ example: "1b3e8c7d-5f2a-4a0c-8d3e-abcdef123456" })
	@IsUUID()
	subscriptionId: string;

	@ApiProperty({ example: "active", required: false, maxLength: 50 })
	@IsString()
	@MaxLength(50)
	@IsOptional()
	groupSubscriptionStatus?: string;

	@ApiProperty({ example: 3, required: false, minimum: 1 })
	@IsInt()
	@Min(1)
	@IsOptional()
	monthQuantity?: number;

	@ApiProperty({ example: "vnpay", required: false, maxLength: 50 })
	@IsString()
	@MaxLength(50)
	@IsOptional()
	paymentBy?: string | null;

	@ApiProperty({ example: false, required: false })
	@IsBoolean()
	@IsOptional()
	isPaid?: boolean;

	@ApiProperty({ example: "2024-08-01T00:00:00.000Z", required: false })
	@IsString()
	@IsOptional()
	startedAt?: string | null;

	@ApiProperty({ example: "2024-09-01T00:00:00.000Z", required: false })
	@IsString()
	@IsOptional()
	endedAt?: string | null;
}
