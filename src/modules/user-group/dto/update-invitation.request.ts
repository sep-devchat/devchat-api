import { ApiProperty } from "@nestjs/swagger";
import { InvitationStatus } from "../user-group.enum";
import { IsEnum } from "class-validator";

export class UpdateInvitationRequest {
	@ApiProperty({
		enum: InvitationStatus,
		description: "Status of invitation (accepted, declined, pending)",
		example: InvitationStatus.Accepted,
	})
	@IsEnum(InvitationStatus)
	status: InvitationStatus;
}
