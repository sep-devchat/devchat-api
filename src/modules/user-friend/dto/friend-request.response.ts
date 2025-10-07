import { ApiProperty } from "@nestjs/swagger";
import { UserResponse } from "@modules/user/dto";
import { UserFriendEntity } from "@db/entities";
import { FriendRequestStatus } from "@utils";

export class FriendRequestResponseDto {
	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Friend request Id",
	})
	id: string;

	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Sender Id",
	})
	senderId: string;

	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Receiver Id",
	})
	receiverId: string;

	@ApiProperty({
		example: FriendRequestStatus.PENDING,
		description: "Friend request status ex: pending, accepted",
	})
	status: number;

	@ApiProperty({
		example: "Can I be your friend?",
		description: "Friend request message",
	})
	message: string | null;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	respondedAt: Date | null;

	@ApiProperty({ type: UserResponse })
	sender: UserResponse;

	@ApiProperty({ type: UserResponse })
	receiver: UserResponse;

	static fromEntity(entity: UserFriendEntity): FriendRequestResponseDto {
		const dto = new FriendRequestResponseDto();
		dto.id = entity.id;
		dto.senderId = entity.senderId;
		dto.receiverId = entity.receiverId;
		dto.status = entity.status;
		dto.message = entity.message;
		dto.createdAt = entity.createdAt;
		dto.respondedAt = entity.respondedAt;

		if (entity.sender) {
			dto.sender = UserResponse.fromEntity(entity.sender);
		}
		if (entity.receiver) {
			dto.receiver = UserResponse.fromEntity(entity.receiver);
		}
		return dto;
	}
}
