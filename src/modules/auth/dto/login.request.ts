import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class LoginRequest {
	@ApiProperty({ example: "jane.doe" /* or "jane@example.com" */ })
	@IsString()
	usernameOrEmail: string;

	@ApiProperty({ example: "P@ssw0rd!" })
	@IsString()
	password: string;
}
