import { ApiPropertyOptional } from "@nestjs/swagger";
import { InvitationStatus } from "@utils";
import { Type } from "class-transformer";
import { IsEnum, IsOptional } from "class-validator";

export class GroupRequestQuery {
	@ApiPropertyOptional({
		example: InvitationStatus.PENDING,
		enum: InvitationStatus,
		description: "Query by task status (0-Pending, 1-Accepted, 2-Declined)",
	})
	@IsEnum(InvitationStatus)
	@IsOptional()
	@Type(() => Number)
	status: InvitationStatus = InvitationStatus.PENDING;
}
