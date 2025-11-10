import { Controller, Param, Query, Get, Delete } from "@nestjs/common";
import { UserFriendService } from "./user-friend.service";
import { UserFriendQuery } from "./dto";
import {
	ApiResponseDto,
	ApiMessageResponseDto,
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
	AuditLog,
} from "@utils";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiTags,
} from "@nestjs/swagger";
import { UserResponse } from "@modules/user/dto";

@Controller("user/friends")
@ApiTags("User Friend")
@ApiBearerAuth()
export class UserFriendController {
	constructor(private readonly userFriendService: UserFriendService) {}

	@Get()
	@ApiOperation({
		summary: "Get all user's friends",
		description:
			"Get paginated list of current user's friends with optional search",
	})
	@SwaggerApiResponse(UserResponse, { isArray: true, withPagination: true })
	@ApiBearerAuth()
	async getAllFriends(@Query() query: UserFriendQuery) {
		const { friends, pagination } =
			await this.userFriendService.getAllFriends(query);
		return new ApiResponseDto(
			UserResponse.fromEntities(friends),
			pagination,
			"Friends retrieved successfully",
		);
	}

	@Get("count")
	@ApiOperation({
		summary: "Get friends count",
		description: "Get the total number of friends for the current user",
	})
	@SwaggerApiResponse(Number)
	async getFriendsCount() {
		const count = await this.userFriendService.getFriendsCount();
		return new ApiResponseDto(
			{ count },
			null,
			"Friends count retrieved successfully",
		);
	}

	@Get(":friendId/status")
	@ApiParam({
		name: "friendId",
		description: "User ID to check friendship status with",
	})
	@ApiOperation({
		summary: "Get friendship status",
		description:
			"Check the friendship status between current user and another user",
	})
	async getFriendshipStatus(@Param("friendId") friendId: string) {
		const status = await this.userFriendService.getFriendshipStatus(friendId);
		return new ApiResponseDto(
			status,
			null,
			"Friendship status retrieved successfully",
		);
	}

	@Get(":userId/mutual")
	@ApiParam({
		name: "userId",
		description: "User ID to find mutual friends with",
	})
	@ApiOperation({
		summary: "Get mutual friends",
		description:
			"Get list of mutual friends between current user and another user",
	})
	@SwaggerApiResponse(UserResponse, { isArray: true })
	async getMutualFriends(@Param("userId") userId: string) {
		const { mutualFriends, count } =
			await this.userFriendService.getMutualFriends(userId);
		return new ApiResponseDto(
			{
				friends: UserResponse.fromEntities(mutualFriends),
				count,
			},
			null,
			"Mutual friends retrieved successfully",
		);
	}

	@Delete(":friendId")
	@ApiParam({ name: "friendId", description: "Friend User ID to unfriend" })
	@ApiOperation({
		summary: "Unfriend a user",
		description: "Remove friendship relationship with another user",
	})
	@SwaggerApiMessageResponse()
	@AuditLog({
		action: "UNFRIEND",
		entityType: "UserFriend",
	})
	async unfriend(@Param("friendId") friendId: string) {
		await this.userFriendService.unfriend(friendId);
		return new ApiMessageResponseDto("Successfully unfriended user");
	}
}
