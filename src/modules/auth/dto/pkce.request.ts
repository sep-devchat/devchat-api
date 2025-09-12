import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class PkceRequest {
	@ApiProperty({ type: String })
	@IsString()
	codeVerifier: string;

	@ApiProperty({ type: String })
	@IsString()
	codeChallengeMethod: string;

	@ApiProperty({ type: String })
	@IsString()
	authCode: string;
}
