import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class SendFriendRequestDto {
	@ApiProperty({
		description: "ID of user to send friend request to",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@IsUUID()
	receiverId: string;

	@ApiProperty({
		description: "Optional message with friend request",
		example: "Hi! I'd like to be friends.",
		required: false,
	})
	@IsOptional()
	@IsString()
	@MaxLength(500)
	message?: string;
}
