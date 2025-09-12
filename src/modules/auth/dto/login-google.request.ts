import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { PkceAuthRequest } from "./pkce-auth.request";

export class LoginGoogleRequest extends PkceAuthRequest {
	@ApiProperty()
	@IsString()
	credential: string;
}
