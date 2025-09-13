import { ApiProperty } from "@nestjs/swagger";

export class LoginPkceResponse {
	@ApiProperty()
	authCode: string;
}
