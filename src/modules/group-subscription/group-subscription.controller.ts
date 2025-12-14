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
import { ApiOperation } from "@nestjs/swagger";
import { GroupSubscriptionService } from "./group-subscription.service";
import {
	CreateGroupSubscriptionRequest,
	UpdateGroupSubscriptionRequest,
	GroupSubscriptionQuery,
} from "./dto";
import { ApiResponseDto } from "@utils";

@Controller("group-subscription")
export class GroupSubscriptionController {
	constructor(
		private readonly groupSubscriptionService: GroupSubscriptionService,
	) {}

	@Post()
	@ApiOperation({
		summary: "Create group subscription",
		description: "Create a subscription instance for a group",
	})
	async createOne(@Body() dto: CreateGroupSubscriptionRequest) {
		await this.groupSubscriptionService.createOne(dto);
		return new ApiResponseDto(null, null, "Created successfully");
	}

	@Put(":id")
	@ApiOperation({
		summary: "Update group subscription",
		description: "Update fields of a group subscription",
	})
	async updateOne(
		@Param("id") id: string,
		@Body() dto: UpdateGroupSubscriptionRequest,
	) {
		await this.groupSubscriptionService.updateOne(id, dto);
		return new ApiResponseDto(null, null, "Updated successfully");
	}

	@Get()
	@ApiOperation({
		summary: "List group subscriptions",
		description: "Return all group subscriptions",
	})
	async findMany(@Query() query: GroupSubscriptionQuery) {
		const data = await this.groupSubscriptionService.findMany(query);
		return new ApiResponseDto(data);
	}

	@Get(":id")
	@ApiOperation({
		summary: "Get group subscription",
		description: "Fetch a group subscription by id",
	})
	async findOne(@Param("id") id: string) {
		const data = await this.groupSubscriptionService.findOne(id);
		return new ApiResponseDto(data);
	}

	@Delete(":id")
	@ApiOperation({
		summary: "Delete group subscription",
		description: "Remove a group subscription by id",
	})
	async deleteOne(@Param("id") id: string) {
		await this.groupSubscriptionService.deleteOne(id);
		return new ApiResponseDto(null, null, "Deleted successfully");
	}
}
