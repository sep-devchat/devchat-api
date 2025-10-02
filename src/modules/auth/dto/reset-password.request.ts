import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, Length } from "class-validator";

export class ResetPasswordRequest {
	@ApiProperty()
	@IsEmail()
	email: string;

	@ApiProperty({ description: "6-digit verification code" })
	@Length(6, 6)
	code: string;

	@ApiProperty({ minLength: 8 })
	@Length(8, 255)
	newPassword: string;
}
