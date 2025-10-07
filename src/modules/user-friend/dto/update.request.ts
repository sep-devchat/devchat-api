import { ApiProperty } from "@nestjs/swagger";
import { FriendRequestStatus } from "@utils";

export class UpdateUserFriendRequest {
	@ApiProperty({
		example: FriendRequestStatus.PENDING,
		description: "Friend request status ex: pending, accepted",
	})
	status: number;
}
