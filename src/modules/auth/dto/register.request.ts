import { ApiProperty } from "@nestjs/swagger";
import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsStrongPassword,
	IsUrl,
	Length,
	Max,
	MaxLength,
	MinLength,
} from "class-validator";

export class RegisterRequest {
	@ApiProperty({ maxLength: 50 })
	@IsString()
	@Length(3, 50)
	@IsNotEmpty()
	@ApiProperty({ maxLength: 50, example: "jane.doe" })
	username: string;

	@ApiProperty({ maxLength: 255 })
	@IsEmail()
	@MaxLength(255)
	@IsNotEmpty()
	@ApiProperty({ maxLength: 255, example: "jane@example.com" })
	email: string;

	@ApiProperty({ minLength: 8, maxLength: 128 })
	@MaxLength(128)
	@IsStrongPassword({
		minLength: 8,
		minLowercase: 1,
		minUppercase: 1,
		minNumbers: 1,
		minSymbols: 1,
	})
	@ApiProperty({ minLength: 8, maxLength: 128, example: "P@ssw0rd!" })
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

	@ApiProperty({ required: false })
	@IsOptional()
	@IsUrl(
		{ require_protocol: true },
		{ message: "avatarUrl must be a valid URL" },
	)
	@ApiProperty({
		required: false,
		example: "https://cdn.example.com/avatars/jane.png",
	})
	avatarUrl?: string;

	@ApiProperty({ required: false, maxLength: 50 })
	@IsOptional()
	@IsString()
	@MaxLength(50)
	@ApiProperty({
		required: false,
		maxLength: 50,
		example: "America/Los_Angeles",
	})
	timezone?: string;
}
