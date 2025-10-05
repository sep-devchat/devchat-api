import { ApiProperty } from "@nestjs/swagger";
import { FriendRequestStatus } from "../user-friend.enum";
import { UserResponse } from "@modules/user/dto";
import { UserEntity, UserFriendEntity } from "@db/entities";

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
		enum: FriendRequestStatus,
		example: FriendRequestStatus.Pending,
		description: "Friend request status ex: pending, accepted",
	})
	status: string;

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
		dto.senderId = entity.sender.id;
		dto.receiverId = entity.sender.id;
		dto.status = entity.status;
		dto.message = entity.message;
		dto.createdAt = entity.createdAt;
		dto.respondedAt = entity.respondedAt;
		dto.sender = UserResponse.fromEntity(entity.sender);
		dto.receiver = UserResponse.fromEntity(entity.receiver);
		return dto;
	}
}
