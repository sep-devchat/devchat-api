import {
	IsOptional,
	IsString,
	IsNumber,
	IsDateString,
	IsBoolean,
	Min,
	Max,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class UpdateGroupInviteLinkDto {
	@ApiProperty({
		description: "Optional name/label for the invite link",
		example: "Weekly Team Meeting - Updated",
		required: false,
	})
	@IsOptional()
	@IsString()
	name?: string;

	@ApiProperty({
		description: "Optional description for the invite link",
		example: "Updated link for new team members to join our weekly meetings",
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
		example: 100,
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

	@ApiProperty({
		description: "Whether the invite link is active",
		example: true,
		required: false,
	})
	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}
