import { ApiProperty } from "@nestjs/swagger";
import {
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
} from "class-validator";

export class CreateGroupInvitationDto {
	@ApiProperty({
		required: true,
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "The id of user to invite to the group",
	})
	@IsString()
	@IsNotEmpty()
	toUserIdOrEmail: string;

	@ApiProperty({
		required: true,
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "The id of the group to invite user to",
	})
	@IsUUID()
	@IsNotEmpty()
	groupId: string;

	@ApiProperty({
		example: "Hi, would you like to join our group?",
		description: "Optional message sent with the group invitation",
	})
	@IsString()
	@MaxLength(255)
	@IsOptional()
	message?: string;
}
