import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class UpdateGroupInvitationRequest {
	@ApiPropertyOptional({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "The id of user to invite to the group",
	})
	@IsOptional()
	@IsUUID()
	toUserId?: string;

	@ApiPropertyOptional({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "The id of the group to invite user to",
	})
	@IsOptional()
	@IsUUID()
	groupId?: string;

	@ApiPropertyOptional({
		example: "Hi, would you like to join our group?",
		description: "Optional message sent with the group invitation",
	})
	@IsOptional()
	@IsString()
	@MaxLength(255)
	message?: string;
}
