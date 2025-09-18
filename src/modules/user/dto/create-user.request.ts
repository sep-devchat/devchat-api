import { UserEntity } from "@db/entities";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";

export class CreateUserRequest {
	@ApiProperty({
		example: "john_doe",
		description: "Unique username",
	})
	@IsString()
	username: string;

	@ApiProperty({
		example: "john@example.com",
		description: "Email address",
	})
	@IsEmail()
	email: string;

	@ApiProperty({
		example: "Password123!",
		description: "User password",
	})
	@IsString()
	password: string;

	// Make these REQUIRED to match UserEntity
	@ApiProperty({
		example: "John",
		description: "First name",
	})
	@IsString()
	firstName: string;

	@ApiProperty({
		example: "Doe",
		description: "Last name",
	})
	@IsString()
	lastName: string;

	@ApiPropertyOptional({
		example: "https://example.com/avatar.jpg",
		description: "Avatar URL",
	})
	@IsOptional()
	@IsString()
	avatarUrl?: string;

	@ApiPropertyOptional({
		example: true,
		description: "Is user active",
		default: true,
	})
	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@ApiPropertyOptional({
		example: false,
		description: "Is email verified",
		default: false,
	})
	@IsOptional()
	@IsBoolean()
	emailVerified?: boolean;

	@ApiPropertyOptional({
		example: "UTC",
		description: "User timezone",
		default: "UTC",
	})
	@IsOptional()
	@IsString()
	timezone?: string;
}
