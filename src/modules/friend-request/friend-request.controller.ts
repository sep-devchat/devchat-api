import {
	Controller,
	Param,
	Body,
	Query,
	Post,
	Get,
	Put,
	Delete,
	Patch,
} from "@nestjs/common";
import { FriendRequestService } from "./friend-request.service";
import {
	CreateFriendRequestDto,
	UpdateFriendRequestRequest,
	FriendRequestQuery,
	FriendRequestResponse,
} from "./dto";
import {
	ApiResponseDto,
	ApiMessageResponseDto,
	AuditLog,
	SwaggerApiResponse,
	SwaggerApiMessageResponse,
} from "@utils";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiTags,
} from "@nestjs/swagger";
import { FriendRequestEntity } from "@db/entities/friend-request.entity";

@Controller("friend-request")
@ApiTags("Friend Request")
@ApiBearerAuth()
export class FriendRequestController {
	constructor(private readonly friendRequestService: FriendRequestService) {}

	@Post()
	@ApiOperation({ summary: "Send a friend request" })
	@SwaggerApiResponse(FriendRequestResponse)
	@AuditLog({
		action: "FRIEND_REQUEST_CREATE",
		entityType: "FriendRequest",
		entity: FriendRequestEntity,
		captureResponse: true,
	})
	async sendFriendRequest(@Body() dto: CreateFriendRequestDto) {
		const response = await this.friendRequestService.createOne(dto);
		return new ApiResponseDto(
			FriendRequestResponse.fromEntity(response),
			null,
			"Friend request sent successfully",
		);
	}

	@Put(":id")
	@ApiParam({ name: "id", description: "Friend Request ID" })
	@ApiOperation({
		summary: "Update friend request",
		description:
			"Update friend request message. Only the sender or recipient can update.",
	})
	@SwaggerApiResponse(FriendRequestResponse)
	@AuditLog({
		action: "FRIEND_REQUEST_UPDATE",
		entityType: "FriendRequest",
		entity: FriendRequestEntity,
		entityIdParam: "id",
		captureResponse: true,
	})
	async updateFriendRequest(
		@Param("id") id: string,
		@Body() dto: UpdateFriendRequestRequest,
	) {
		const response = await this.friendRequestService.updateOne(id, dto);
		return new ApiResponseDto(
			FriendRequestResponse.fromEntity(response),
			null,
			"Friend request updated successfully",
		);
	}

	@Get()
	@ApiOperation({
		summary: "Get friend requests",
		description:
			"Get paginated list of friend requests with filtering options (sent, received, or all)",
	})
	@SwaggerApiResponse(FriendRequestResponse, {
		isArray: true,
		withPagination: true,
	})
	async getFriendRequests(@Query() query: FriendRequestQuery) {
		const { data, pagination } =
			await this.friendRequestService.findMany(query);
		return new ApiResponseDto(
			FriendRequestResponse.fromEntities(data),
			pagination,
			"Friend requests retrieved successfully",
		);
	}

	@Get("count")
	@ApiOperation({
		summary: "Get friend requests count",
		description:
			"Get the count of friend requests received by the current user",
	})
	@SwaggerApiResponse(Number)
	async getRequestsCount() {
		const count = await this.friendRequestService.getRequestsCount();
		return new ApiResponseDto(
			{ count },
			null,
			"Friend requests count retrieved successfully",
		);
	}

	@Get(":id")
	@ApiParam({ name: "id", description: "Friend Request ID" })
	@ApiOperation({
		summary: "Get a specific friend request",
		description:
			"Get details of a specific friend request. Users can only access requests they sent or received.",
	})
	@SwaggerApiResponse(FriendRequestResponse)
	async getFriendRequest(@Param("id") id: string) {
		const data = await this.friendRequestService.findOne(id);
		return new ApiResponseDto(
			FriendRequestResponse.fromEntity(data),
			null,
			"Friend request retrieved successfully",
		);
	}

	@Patch(":id/accept")
	@ApiParam({ name: "id", description: "Friend Request ID" })
	@ApiOperation({
		summary: "Accept a friend request",
		description:
			"Accept a friend request. Creates friendship and deletes the request. Only the recipient can accept.",
	})
	@SwaggerApiMessageResponse()
	@AuditLog({
		action: "FRIEND_REQUEST_ACCEPT",
		entityType: "FriendRequest",
		entity: FriendRequestEntity,
		entityIdParam: "id",
		captureResponse: true,
	})
	async acceptFriendRequest(@Param("id") id: string) {
		const response = await this.friendRequestService.acceptFriendRequest(id);
		return new ApiMessageResponseDto(response.message);
	}

	@Patch(":id/decline")
	@ApiParam({ name: "id", description: "Friend Request ID" })
	@ApiOperation({
		summary: "Decline a friend request",
		description:
			"Decline a friend request. Deletes the request. Only the recipient can decline.",
	})
	@SwaggerApiMessageResponse()
	@AuditLog({
		action: "FRIEND_REQUEST_DECLINE",
		entityType: "FriendRequest",
		entity: FriendRequestEntity,
		entityIdParam: "id",
		captureResponse: true,
	})
	async declineFriendRequest(@Param("id") id: string) {
		const response = await this.friendRequestService.declineFriendRequest(id);
		return new ApiMessageResponseDto(response.message);
	}

	@Delete(":id")
	@ApiParam({ name: "id", description: "Friend Request ID" })
	@ApiOperation({
		summary: "Delete a friend request",
		description:
			"Delete a friend request. Only the sender can delete their own requests.",
	})
	@SwaggerApiMessageResponse()
	@AuditLog({
		action: "FRIEND_REQUEST_DELETE",
		entityType: "FriendRequest",
		entity: FriendRequestEntity,
		entityIdParam: "id",
	})
	async deleteFriendRequest(@Param("id") id: string) {
		await this.friendRequestService.deleteOne(id);
		return new ApiMessageResponseDto("Friend request deleted successfully");
	}

	@Patch(":id/cancel")
	@ApiParam({ name: "id", description: "Friend Request ID" })
	@ApiOperation({
		summary: "Cancel a friend request",
		description:
			"Cancel a friend request. Deletes the request. Only the sender can cancel.",
	})
	@SwaggerApiMessageResponse()
	@AuditLog({
		action: "FRIEND_REQUEST_CANCEL",
		entityType: "FriendRequest",
		entity: FriendRequestEntity,
		entityIdParam: "id",
	})
	async cancelFriendRequest(@Param("id") id: string) {
		const response = await this.friendRequestService.cancelFriendRequest(id);
		return new ApiMessageResponseDto(response.message);
	}
}
