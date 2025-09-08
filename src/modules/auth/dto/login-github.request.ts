import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LoginGitHubRequest {
	@ApiProperty()
	@IsString()
	code: string;
}
