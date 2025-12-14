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
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SubscriptionService } from "./subscription.service";
import {
	CreateSubscriptionRequest,
	UpdateSubscriptionRequest,
	SubscriptionQuery,
} from "./dto";
import { ApiResponseDto } from "@utils";

@ApiTags("subscription")
@Controller("subscription")
export class SubscriptionController {
	constructor(private readonly subscriptionService: SubscriptionService) {}

	@Post()
	@ApiOperation({
		summary: "Create subscription plan",
		description: "Creates a subscription plan with limits and pricing",
	})
	async createOne(@Body() dto: CreateSubscriptionRequest) {
		const data = await this.subscriptionService.createOne(dto);
		return new ApiResponseDto(data, null, "Created successfully");
	}

	@Get()
	@ApiOperation({
		summary: "List subscription plans",
		description: "Returns all subscription plans",
	})
	async findMany(@Query() query: SubscriptionQuery) {
		const data = await this.subscriptionService.findMany(query);
		return new ApiResponseDto(data);
	}

	@Get(":id")
	@ApiOperation({
		summary: "Get subscription plan",
		description: "Fetch a single subscription plan by id",
	})
	async findOne(@Param("id") id: string) {
		const data = await this.subscriptionService.findOne(id);
		return new ApiResponseDto(data);
	}

	@Put(":id")
	@ApiOperation({
		summary: "Update subscription plan",
		description: "Update fields of a subscription plan",
	})
	async updateOne(
		@Param("id") id: string,
		@Body() dto: UpdateSubscriptionRequest,
	) {
		const data = await this.subscriptionService.updateOne(id, dto);
		return new ApiResponseDto(data, null, "Updated successfully");
	}

	@Delete(":id")
	@ApiOperation({
		summary: "Delete subscription plan",
		description: "Remove a subscription plan by id",
	})
	async deleteOne(@Param("id") id: string) {
		await this.subscriptionService.deleteOne(id);
		return new ApiResponseDto(null, null, "Deleted successfully");
	}
}
