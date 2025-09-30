import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateUserMessageDeleteRequest {
	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Message ID to delete for the user",
	})
	@IsString()
	@IsNotEmpty()
	messageId: string;
}
