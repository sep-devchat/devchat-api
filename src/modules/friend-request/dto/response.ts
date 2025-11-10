import { FriendRequestEntity } from "@db/entities";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserResponse } from "@modules/user/dto";

export class FriendRequestResponse {
	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Friend request ID",
	})
	id: string;

	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "ID of the user who sent the friend request",
	})
	fromUserId: string;

	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "ID of the user who received the friend request",
	})
	toUserId: string;

	@ApiPropertyOptional({
		example: "Hi! I'd like to add you as a friend.",
		description: "Optional message sent with the friend request",
	})
	message?: string;

	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "ID of the user who created this friend request",
	})
	createdBy: string;

	@ApiPropertyOptional({
		type: () => UserResponse,
		description: "User who sent the friend request",
	})
	fromUser?: UserResponse;

	@ApiPropertyOptional({
		type: () => UserResponse,
		description: "User who received the friend request",
	})
	toUser?: UserResponse;

	@ApiProperty({
		example: "2024-01-01T00:00:00.000Z",
		description: "Creation date",
	})
	createdAt: Date;

	@ApiProperty({
		example: "2024-01-01T00:00:00.000Z",
		description: "Last update date",
	})
	updatedAt: Date;

	static fromEntity(entity: FriendRequestEntity): FriendRequestResponse {
		return {
			id: entity.id,
			fromUserId: entity.fromUserId,
			toUserId: entity.toUserId,
			message: entity.message,
			createdBy: entity.createdBy,
			fromUser: entity.fromUser
				? UserResponse.fromEntity(entity.fromUser)
				: undefined,
			toUser: entity.toUser
				? UserResponse.fromEntity(entity.toUser)
				: undefined,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}

	static fromEntities(
		entities: FriendRequestEntity[],
	): FriendRequestResponse[] {
		return entities.map((entity) => this.fromEntity(entity));
	}
}
