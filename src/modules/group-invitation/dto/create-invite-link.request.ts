import {
	IsOptional,
	IsString,
	IsNumber,
	IsDateString,
	Min,
	Max,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateGroupInviteLinkDto {
	@ApiProperty({
		description: "Group ID to create invite link for",
		example: "550e8400-e29b-41d4-a716-446655440000",
	})
	@IsString()
	groupId: string;

	@ApiProperty({
		description: "Optional description for the invite link",
		example: "Link for new team members to join our weekly meetings",
		required: false,
	})
	@IsOptional()
	@IsString()
	description?: string;

	@ApiProperty({
		description: "Optional expiration date for the invite link (ISO string)",
		example: "2024-12-31T23:59:59.000Z",
		required: false,
	})
	@IsOptional()
	@IsDateString()
	expiresAt?: string;

	@ApiProperty({
		description: "Maximum number of uses for this invite link (1-1000)",
		example: 50,
		minimum: 1,
		maximum: 1000,
		required: false,
	})
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	@Min(1)
	@Max(1000)
	maxUses?: number;
}
