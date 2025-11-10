import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class UpdateFriendRequestRequest {
	@ApiPropertyOptional({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "The id of user want to add friend",
	})
	@IsOptional()
	@IsUUID()
	toUserId?: string;

	@ApiPropertyOptional({
		example: "Hi i want to be friend",
		description: "The description of friend request",
	})
	@IsOptional()
	@IsString()
	@MaxLength(255)
	message?: string;
}
