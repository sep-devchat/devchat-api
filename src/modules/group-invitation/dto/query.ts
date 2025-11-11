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
		example: "developers",
		description: "Search by group name or username",
	})
	@IsOptional()
	@IsString()
	search?: string;
}
