import { ApiProperty } from "@nestjs/swagger";

export class TokenRefreshRequest {
	@ApiProperty({ description: "Refresh token previously issued by the server" })
	refreshToken: string;
}
