import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { PkceAuthRequest } from "./pkce-auth.request";

export class LoginGitHubRequest extends PkceAuthRequest {
	@ApiProperty()
	@IsString()
	code: string;
}
