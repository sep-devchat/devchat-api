import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class JoinRoomRequest {
	@ApiProperty({ description: "Group ID to join", format: "uuid" })
	@IsUUID()
	groupId: string;

	@ApiProperty({ description: "Channel ID to join", format: "uuid" })
	@IsUUID()
	channelId: string;
}
