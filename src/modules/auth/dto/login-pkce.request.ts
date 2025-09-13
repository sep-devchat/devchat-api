import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { LoginRequest } from "./login.request";

export class LoginPkceRequest extends LoginRequest {
	@ApiProperty({ type: String })
	@IsString()
	codeChallenge: string;

	@ApiProperty({ type: String })
	@IsString()
	codeChallengeMethod: string;
}
