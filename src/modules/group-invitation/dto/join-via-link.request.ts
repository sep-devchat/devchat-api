import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class JoinViaLinkDto {
	@ApiProperty({
		description: "Invite link token to join the group",
		example: "abc123def456ghi789",
	})
	@IsString()
	token: string;
}
