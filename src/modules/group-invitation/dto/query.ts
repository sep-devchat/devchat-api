import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsString, IsUUID, Min, Max, IsInt } from "class-validator";

export class GroupInvitationQuery {
	@ApiPropertyOptional({
		example: 1,
		description: "Page number for pagination",
		minimum: 1,
		default: 1,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page: number = 1;

	@ApiPropertyOptional({
		example: 10,
		description: "Number of items per page",
		minimum: 1,
		maximum: 100,
		default: 10,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit: number = 10;

	@ApiPropertyOptional({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Filter by user who sent the invitation",
	})
	@IsOptional()
	@IsUUID()
	fromUserId?: string;

	@ApiPropertyOptional({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Filter by user who received the invitation",
	})
	@IsOptional()
	@IsUUID()
	toUserId?: string;

	@ApiPropertyOptional({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Filter by group ID",
	})
	@IsOptional()
	@IsUUID()
	groupId?: string;

	@ApiPropertyOptional({
		example: "developers",
		description: "Search by group name or username",
	})
	@IsOptional()
	@IsString()
	search?: string;

	@ApiPropertyOptional({
		example: "sent",
		description:
			"Filter invitations: 'sent' (invitations I sent), 'received' (invitations I received), 'all' (both)",
		enum: ["sent", "received", "all"],
		default: "all",
	})
	@IsOptional()
	@IsString()
	type: "sent" | "received" | "all" = "all";
}
