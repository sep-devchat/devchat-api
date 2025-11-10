import { ApiOperation, ApiProperty } from "@nestjs/swagger";
import {
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
} from "class-validator";

export class CreateFriendRequestDto {
	@ApiProperty({
		required: true,
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "The id of user want to add friend",
	})
	@IsUUID()
	@IsNotEmpty()
	toUserId: string;

	@ApiProperty({
		example: "Hi i want to be friend",
		description: "The description of friend request",
	})
	@IsString()
	@MaxLength(255)
	@IsOptional()
	message?: string;
}
