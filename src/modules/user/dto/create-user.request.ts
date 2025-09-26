import { ApiProperty } from "@nestjs/swagger";
import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsStrongPassword,
	IsUrl,
	Length,
	MaxLength,
} from "class-validator";

export class CreateUserRequest {
	@ApiProperty({ maxLength: 50, example: "jane.doe" })
	@IsString()
	@Length(3, 50)
	@IsNotEmpty()
	username: string;

	@ApiProperty({ maxLength: 255, example: "jane@example.com" })
	@IsEmail()
	@MaxLength(255)
	@IsNotEmpty()
	email: string;

	@ApiProperty({ minLength: 8, maxLength: 128, example: "P@ssw0rd!" })
	@MaxLength(128)
	@IsStrongPassword({
		minLength: 8,
		minLowercase: 1,
		minUppercase: 1,
		minNumbers: 1,
		minSymbols: 1,
	})
	password: string;

	@ApiProperty({ maxLength: 100 })
	@IsString()
	@MaxLength(100)
	@IsNotEmpty()
	firstName: string;

	@ApiProperty({ maxLength: 100 })
	@IsString()
	@MaxLength(100)
	@IsNotEmpty()
	lastName: string;

	@ApiProperty({
		required: false,
		example: "https://cdn.example.com/avatars/jane.png",
	})
	@IsOptional()
	@IsUrl(
		{ require_protocol: true },
		{ message: "avatarUrl must be a valid URL" },
	)
	avatarUrl?: string;

	@ApiProperty({
		required: false,
		maxLength: 50,
		example: "America/Los_Angeles",
	})
	@IsOptional()
	@IsString()
	@MaxLength(50)
	timezone?: string;
}
