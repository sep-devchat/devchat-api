import {
	Controller,
	Delete,
	Get,
	Post,
	Param,
	Body,
	Put,
	Query,
} from "@nestjs/common";
import { UserService } from "./user.service";
import {
	ApiMessageResponseDto,
	ApiResponseDto,
	SkipAuth,
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
} from "@utils";
import { CreateUserRequest } from "./dto/create-user.request";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiQuery,
} from "@nestjs/swagger";
import {
	UpdateUserRequest,
	UserQuery,
	FriendRequestSearchQuery,
	GroupInvitationSearchQuery,
} from "./dto";
import { UserResponse } from "./dto/user.response";
import { TaskResponse } from "@modules/task/dto";
import { FriendRequestResponse } from "@modules/friend-request/dto";
import { GroupInvitationResponse } from "@modules/group-invitation/dto";

@Controller("user")
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get(":uniqueKey")
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get user by unique key (ID, username, or email)" })
	@ApiParam({ name: "uniqueKey", description: "User ID, username, or email" })
	@SwaggerApiResponse(UserResponse, { isArray: true, withPagination: true })
	async getUserByUniqueKey(@Param("uniqueKey") uniqueKey: string) {
		const response = await this.userService.findByUniqueKey(uniqueKey);
		return new ApiResponseDto<UserResponse>(
			UserResponse.fromEntity(response),
			null,
			"User retrieved successfully",
		);
	}

	@Post()
	@ApiOperation({ summary: "Create a new user" })
	@SwaggerApiMessageResponse()
	@SkipAuth()
	async register(@Body() dto: CreateUserRequest) {
		await this.userService.create(dto);
		return new ApiMessageResponseDto("User created successfully");
	}

	@Put(":id")
	@ApiBearerAuth()
	@ApiOperation({ summary: "Update user" })
	@ApiParam({ name: "id", description: "User ID" })
	@SwaggerApiMessageResponse()
	async updateUser(
		@Param("id") id: string,
		@Body() updateData: UpdateUserRequest,
	) {
		await this.userService.update(id, updateData);

		return new ApiMessageResponseDto("User updated successfully");
	}

	@Delete(":id")
	@ApiBearerAuth()
	@ApiOperation({ summary: "Delete user" })
	@ApiParam({ name: "id", description: "User ID" })
	@SwaggerApiMessageResponse()
	async deleteUser(@Param("id") id: string) {
		await this.userService.delete(id);
		return new ApiMessageResponseDto("User deleted successfully");
	}

	@Get()
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get all users" })
	@ApiQuery({
		name: "search",
		required: false,
		description: "Search term for username, email, first or last name",
	})
	@SwaggerApiResponse(UserResponse, { isArray: true, withPagination: true })
	async getUsers(@Query() query: UserQuery) {
		const trimmedSearch = query.search?.trim();
		let response;
		if (trimmedSearch) {
			response = await this.userService.search({
				...query,
				search: trimmedSearch,
			});
		} else {
			response = await this.userService.getAll(query);
		}
		return new ApiResponseDto<UserResponse[]>(
			UserResponse.fromEntities(response.data),
			response.pagination,
			trimmedSearch
				? "Users searched successfully"
				: "Users retrieved successfully",
		);
	}

	@Get("friend-requests/sent")
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get friend requests sent by the user" })
	@SwaggerApiResponse(FriendRequestResponse, { isArray: true })
	async getSentFriendRequests(@Query() query: FriendRequestSearchQuery) {
		const response = await this.userService.getSentFriendRequests(query.search);

		return new ApiResponseDto<FriendRequestResponse[]>(
			FriendRequestResponse.fromEntities(response),
			null,
			"Sent friend requests retrieved successfully",
		);
	}

	@Get("friend-requests/received")
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get friend requests received by the user" })
	@SwaggerApiResponse(FriendRequestResponse, { isArray: true })
	async getReceivedFriendRequests(@Query() query: FriendRequestSearchQuery) {
		const response = await this.userService.getReceivedFriendRequests(
			query.search,
		);
		return new ApiResponseDto<FriendRequestResponse[]>(
			FriendRequestResponse.fromEntities(response),
			null,
			"Received friend requests retrieved successfully",
		);
	}

	@Get("group-invitations/sent")
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get all sent group invitations" })
	@SwaggerApiResponse(GroupInvitationResponse, { isArray: true })
	async getSentGroupInvitations(@Query() query: GroupInvitationSearchQuery) {
		const response = await this.userService.getSentGroupInvitations(
			query.search,
		);

		return new ApiResponseDto(
			GroupInvitationResponse.fromEntities(response),
			null,
			"Sent group invitations retrieved successfully",
		);
	}

	@Get("group-invitations/received")
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get all received group invitations" })
	@SwaggerApiResponse(GroupInvitationResponse, { isArray: true })
	async getReceivedGroupInvitations(
		@Query() query: GroupInvitationSearchQuery,
	) {
		const response = await this.userService.getReceivedGroupInvitations(
			query.search,
		);

		return new ApiResponseDto(
			GroupInvitationResponse.fromEntities(response),
			null,
			"Received group invitations retrieved successfully",
		);
	}

	@Get("task/:groupId")
	@ApiBearerAuth()
	@ApiOperation({
		summary: "Get all tasks belong to authorized user to a group",
	})
	@SwaggerApiResponse(TaskResponse, { isArray: true, withPagination: true })
	async getTasksByGroupId(@Param("groupId") groupId: string) {
		const response = await this.userService.getTasksByGroupId(groupId);

		return new ApiResponseDto<TaskResponse[]>(
			TaskResponse.fromEntities(response),
			null,
			"Tasks retrieved succe1ssfully",
		);
	}
}
