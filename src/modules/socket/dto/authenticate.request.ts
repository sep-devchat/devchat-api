import { IsString } from "class-validator";

export class AuthenticateRequest {
	@IsString()
	token: string;
}
