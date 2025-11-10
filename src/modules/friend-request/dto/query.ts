import { ApiPropertyOptional } from "@nestjs/swagger";
import { FriendRequestStatus } from "@utils";
import { Type } from "class-transformer";
import {
	IsEnum,
	IsOptional,
	IsString,
	IsUUID,
	Min,
	Max,
	IsInt,
} from "class-validator";

export class FriendRequestQuery {
	@ApiPropertyOptional({
		example: 1,
		description: "Page number for pagination",
		minimum: 1,
		default: 1,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page: number = 1;

	@ApiPropertyOptional({
		example: 10,
		description: "Number of items per page",
		minimum: 1,
		maximum: 100,
		default: 10,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit: number = 10;

	@ApiPropertyOptional({
		example: FriendRequestStatus.PENDING,
		description:
			"Filter by friend request status (0-Pending, 1-Accepted, 2-Declined, 3-Unfriend)",
		enum: FriendRequestStatus,
	})
	@IsOptional()
	@Type(() => Number)
	@IsEnum(FriendRequestStatus)
	status?: FriendRequestStatus;

	@ApiPropertyOptional({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Filter by user who sent the request",
	})
	@IsOptional()
	@IsUUID()
	fromUserId?: string;

	@ApiPropertyOptional({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Filter by user who received the request",
	})
	@IsOptional()
	@IsUUID()
	toUserId?: string;

	@ApiPropertyOptional({
		example: "john",
		description: "Search by username or display name",
	})
	@IsOptional()
	@IsString()
	search?: string;

	@ApiPropertyOptional({
		example: "sent",
		description:
			"Filter requests: 'sent' (requests I sent), 'received' (requests I received), 'all' (both)",
		enum: ["sent", "received", "all"],
		default: "all",
	})
	@IsOptional()
	@IsString()
	type: "sent" | "received" | "all" = "all";
}
