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
	CreateUserFriendRequest,
	UpdateUserFriendRequest,
	UserFriendQuery,
} from "./dto";
import { ApiResponseDto } from "@utils";

@Controller("user-friend")
export class UserFriendController {
	constructor(private readonly userFriendService: UserFriendService) {}

	@Post()
	async createOne(@Body() dto: CreateUserFriendRequest) {
		await this.userFriendService.createOne(dto);
		return new ApiResponseDto(null, null, "Created successfully");
	}

	@Put(":id")
	async updateOne(
		@Param("id") id: string,
		@Body() dto: UpdateUserFriendRequest,
	) {
		await this.userFriendService.updateOne(id, dto);
		return new ApiResponseDto(null, null, "Updated successfully");
	}

	@Get()
	async findMany(@Query() query: UserFriendQuery) {
		const data = await this.userFriendService.findMany(query);
		return new ApiResponseDto(data);
	}

	@Get(":id")
	async findOne(@Param("id") id: string) {
		const data = await this.userFriendService.findOne(id);
		return new ApiResponseDto(data);
	}

	@Delete(":id")
	async deleteOne(@Param("id") id: string) {
		await this.userFriendService.deleteOne(id);
		return new ApiResponseDto(null, null, "Deleted successfully");
	}
}
