import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { PkceAuthRequest } from "./pkce-auth.request";

export class LoginRequest extends PkceAuthRequest {
	@ApiProperty({ example: "jane.doe" /* or "jane@example.com" */ })
	@IsString()
	usernameOrEmail: string;

	@ApiProperty({ example: "P@ssw0rd!" })
	@IsString()
	password: string;
}
