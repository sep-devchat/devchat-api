import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class PkceAuthRequest {
	@ApiProperty({ type: Boolean, required: false })
	@IsBoolean()
	@IsOptional()
	pkce?: boolean;

	@ApiProperty({ type: String, required: false })
	@IsString()
	@IsOptional()
	codeChallenge?: string;

	@ApiProperty({ type: String, required: false })
	@IsString()
	@IsOptional()
	codeChallengeMethod?: string;
}
