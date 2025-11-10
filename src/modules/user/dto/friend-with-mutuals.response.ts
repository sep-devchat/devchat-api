import { UserEntity } from "@db/entities";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserResponse } from "./user.response";

export class FriendWithMutualsResponse extends UserResponse {
	@ApiProperty({
		type: [UserResponse],
		description: "List of mutual friends",
	})
	mutualFriends: UserResponse[];

	@ApiProperty({
		example: 5,
		description: "Count of mutual friends",
	})
	mutualFriendsCount: number;

	static fromEntityWithMutuals(
		entity: UserEntity,
		mutualFriends: UserEntity[],
		mutualFriendsCount: number,
	): FriendWithMutualsResponse {
		const baseResponse = UserResponse.fromEntity(entity);
		return {
			...baseResponse,
			mutualFriends: UserResponse.fromEntities(mutualFriends),
			mutualFriendsCount,
		};
	}

	static fromEntitiesWithMutuals(
		entitiesWithMutuals: Array<{
			entity: UserEntity;
			mutualFriends: UserEntity[];
			mutualFriendsCount: number;
		}>,
	): FriendWithMutualsResponse[] {
		return entitiesWithMutuals.map((item) =>
			this.fromEntityWithMutuals(
				item.entity,
				item.mutualFriends,
				item.mutualFriendsCount,
			),
		);
	}

	static fromFriendWithMutuals(friend: any): FriendWithMutualsResponse {
		const { mutualFriends, mutualFriendsCount, ...userEntity } = friend;
		return {
			...UserResponse.fromEntity(userEntity),
			mutualFriends: UserResponse.fromEntities(mutualFriends || []),
			mutualFriendsCount: mutualFriendsCount || 0,
		};
	}

	static fromFriendsWithMutuals(
		friends: Array<any>,
	): FriendWithMutualsResponse[] {
		return friends.map((friend) => this.fromFriendWithMutuals(friend));
	}
}
