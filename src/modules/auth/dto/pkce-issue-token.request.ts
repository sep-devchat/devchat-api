import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class PkceIssueTokenRequest {
	@ApiProperty()
	@IsString()
	codeVerifier: string;

	@ApiProperty()
	@IsString()
	codeChallengeMethod: string;

	@ApiProperty()
	@IsString()
	authCode: string;
}
