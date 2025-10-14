import {
	Controller,
	Param,
	Body,
	Query,
	Post,
	Get,
	Put,
	Delete,
	UseGuards,
} from "@nestjs/common";
import { ThreadService } from "./thread.service";
import { CreateThreadRequest, UpdateThreadRequest } from "./dto";
import {
	ApiResponseDto,
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
} from "@utils";
import { ThreadResponse } from "./dto";
import { ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { GroupGuard } from "@modules/group";
import { ChannelGuard } from "@modules/channel";

@Controller("group/:groupId/channel/:channelId/thread")
@ApiParam({ name: "groupId", type: String, required: true })
@ApiParam({ name: "channelId", type: String, required: true })
@ApiBearerAuth()
@UseGuards(GroupGuard, ChannelGuard)
export class ThreadController {
	constructor(private readonly threadService: ThreadService) {}

	@Post()
	@SwaggerApiMessageResponse()
	async createOne(@Body() dto: CreateThreadRequest) {
		await this.threadService.createOne(dto);
		return new ApiResponseDto(null, null, "Created successfully");
	}

	@Put(":threadId")
	@ApiParam({ name: "threadId", type: String, required: true })
	@SwaggerApiMessageResponse()
	async updateOne(
		@Param("threadId") threadId: string,
		@Body() dto: UpdateThreadRequest,
	) {
		await this.threadService.updateOne(threadId, dto);
		return new ApiResponseDto(null, null, "Updated successfully");
	}

	@Get()
	@SwaggerApiResponse(ThreadResponse, { isArray: true })
	async findMany() {
		const data = await this.threadService.findMany();
		return new ApiResponseDto(data);
	}

	@Get(":threadId")
	@ApiParam({ name: "threadId", type: String, required: true })
	@SwaggerApiResponse(ThreadResponse)
	async findOne(@Param("threadId") threadId: string) {
		const data = await this.threadService.findOne(threadId);
		return new ApiResponseDto(data);
	}

	@Delete(":threadId")
	@ApiParam({ name: "threadId", type: String, required: true })
	@SwaggerApiMessageResponse()
	async deleteOne(@Param("threadId") threadId: string) {
		await this.threadService.deleteOne(threadId);
		return new ApiResponseDto(null, null, "Deleted successfully");
	}
}
