import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";

export class GroupInvitationSearchQuery {
	@ApiPropertyOptional({
		description: "Search by group name",
		example: "developers",
		minLength: 1,
	})
	@IsOptional()
	@IsString()
	@MinLength(1)
	search?: string;
}
