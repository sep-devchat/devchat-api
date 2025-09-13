import { ApiProperty } from "@nestjs/swagger";

export class PkceIssueTokenRequest {
	@ApiProperty()
	codeVerifier: string;

	@ApiProperty()
	codeChallengeMethod: string;

	@ApiProperty()
	authCode: string;
}
