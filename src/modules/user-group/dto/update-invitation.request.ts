import { ApiProperty } from "@nestjs/swagger";
import { InvitationStatus } from "@utils";
import { Max, Min } from "class-validator";
import { CreateInvitationRequest } from "./create.request";

export class UpdateInvitationRequest extends CreateInvitationRequest {
	@ApiProperty({
		description: "Status of invitation (0-pending, 1-accepted, 2-declined)",
		example: InvitationStatus.ACCEPTED,
	})
	@Min(0)
	@Max(2)
	status: number;
}
