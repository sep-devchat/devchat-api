import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class SendResetCodeRequest {
	@ApiProperty()
	@IsEmail()
	email: string;
}
