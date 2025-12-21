import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class DeleteUserRequest {
	@ApiProperty({
		description: "Reason provided when banning/deleting the user",
		maxLength: 1024,
		example: "Repeated violations of community guidelines",
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(1024)
	banReason: string;
}
