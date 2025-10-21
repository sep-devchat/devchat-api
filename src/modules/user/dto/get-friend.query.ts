import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FriendRequestStatus, TaskStatusEnum } from "@utils";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional } from "class-validator";

export class GetFriendRequestQuery {
	@ApiPropertyOptional({
		example: FriendRequestStatus.PENDING,
		enum: FriendRequestStatus,
		description:
			"Filter by friend request status (0-Pending, 1-Accepted, 2-Declined, 3-Cancelled)",
	})
	@IsEnum(FriendRequestStatus)
	@IsOptional()
	@Type(() => Number)
	status: FriendRequestStatus = FriendRequestStatus.PENDING;
}
