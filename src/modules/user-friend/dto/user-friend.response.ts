import { ApiProperty } from "@nestjs/swagger";
import { UserResponse } from "@modules/user/dto";
import { UserFriendEntity } from "@db/entities";

export class UserFriendResponse {
	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "User Friend relationship ID",
	})
	id: string;

	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "User ID",
	})
	userId: string;

	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Friend User ID",
	})
	friendId: string;

	@ApiProperty({
		example: "2024-01-01T00:00:00.000Z",
		description: "Friendship created date",
	})
	createdAt: Date;

	@ApiProperty({
		example: "2024-01-01T00:00:00.000Z",
		description: "Last update date",
	})
	updatedAt: Date;

	@ApiProperty({
		type: UserResponse,
		description: "User information",
	})
	user: UserResponse;

	@ApiProperty({
		type: UserResponse,
		description: "Friend user information",
	})
	friend: UserResponse;

	static fromEntity(entity: UserFriendEntity): UserFriendResponse {
		return {
			id: entity.id,
			userId: entity.userId,
			friendId: entity.friendId,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			user: entity.user ? UserResponse.fromEntity(entity.user) : undefined,
			friend: entity.friend
				? UserResponse.fromEntity(entity.friend)
				: undefined,
		};
	}

	static fromEntities(entities: UserFriendEntity[]): UserFriendResponse[] {
		return entities.map((entity) => this.fromEntity(entity));
	}
}
