import {
	Controller,
	Param,
	Body,
	Query,
	Post,
	Get,
	Put,
	Delete,
} from "@nestjs/common";
import { UserFriendService } from "./user-friend.service";
import {
	FriendRequestResponseDto,
	SendFriendRequestDto,
	UpdateUserFriendRequest,
	UserFriendQuery,
} from "./dto";
import {
	ApiResponseDto,
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
} from "@utils";
import { ApiBearerAuth, ApiOperation, ApiParam } from "@nestjs/swagger";
import { UserResponse } from "@modules/user/dto";
import { UserFriendEntity } from "@db/entities";

@Controller("user-friend")
@ApiBearerAuth()
export class UserFriendController {
	constructor(private readonly userFriendService: UserFriendService) {}

	@Post()
	@ApiOperation({
		summary: "Send friend request to a user",
	})
	@SwaggerApiResponse(FriendRequestResponseDto)
	async createOne(@Body() dto: SendFriendRequestDto) {
		const friendRequest = await this.userFriendService.sendFriendRequest(dto);
		return new ApiResponseDto(
			FriendRequestResponseDto.fromEntity(friendRequest),
			null,
			"Created successfully",
		);
	}

	@Put(":id")
	@ApiParam({ name: "id", description: "User friend ID" })
	@ApiOperation({
		summary: "Update user friend request status like accepted or declined",
	})
	@SwaggerApiMessageResponse()
	async updateOne(
		@Param("id") id: string,
		@Body() request: UpdateUserFriendRequest,
	) {
		await this.userFriendService.updateFriendRequest(id, request);
		return new ApiResponseDto(null, null, "Updated successfully");
	}

	@Get()
	@ApiOperation({
		summary: "Get all user's friends",
	})
	@SwaggerApiResponse(UserResponse)
	async findMany(@Query() query: UserFriendQuery) {
		const data = await this.userFriendService.getAllFriends(query);
		const { friends, pagination } = data;
		return new ApiResponseDto(
			UserResponse.fromEntities(friends),
			pagination,
			"Retrieved friends successfully",
		);
	}

	// @Get(":id")
	// async findOne(@Param("id") id: string) {
	// 	const data = await this.userFriendService.findOne(id);
	// 	return new ApiResponseDto(data);
	// }

	@Delete(":id")
	@ApiParam({ name: "id", description: "User friend ID" })
	@ApiOperation({
		summary: "Get all user's friends",
	})
	async deleteOne(@Param("id") id: string) {
		await this.userFriendService.removeFriend(id);
		return new ApiResponseDto(null, null, "Deleted successfully");
	}
}
