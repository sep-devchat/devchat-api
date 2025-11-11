import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";

export class FriendRequestSearchQuery {
	@ApiPropertyOptional({
		description: "Search by user name (first name, last name, or username)",
		example: "john",
		minLength: 1,
	})
	@IsOptional()
	@IsString()
	@MinLength(1)
	search?: string;
}
