import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { LoginMethodEnum } from "@utils";

export class LoginRequest {
	@ApiProperty({ type: String, enum: LoginMethodEnum })
	@IsEnum(LoginMethodEnum)
	method: LoginMethodEnum;

	@ApiProperty({ type: String })
	code: string;
}
