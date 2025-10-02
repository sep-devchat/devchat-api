import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, Length } from "class-validator";

export class ConfirmResetCodeRequest {
	@ApiProperty()
	@IsEmail()
	email: string;

	@ApiProperty({ description: "6-digit verification code" })
	@Length(6, 6)
	code: string;
}
