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

	@Put(":id")
	@ApiParam({ name: "id", type: String, required: true })
	@SwaggerApiMessageResponse()
	async updateOne(@Param("id") id: string, @Body() dto: UpdateThreadRequest) {
		await this.threadService.updateOne(id, dto);
		return new ApiResponseDto(null, null, "Updated successfully");
	}

	@Get()
	@SwaggerApiResponse(ThreadResponse, { isArray: true, withPagination: true })
	async findMany() {
		const data = await this.threadService.findMany();
		return new ApiResponseDto(data);
	}

	@Get(":id")
	@ApiParam({ name: "id", type: String, required: true })
	@SwaggerApiResponse(ThreadResponse)
	async findOne(@Param("id") id: string) {
		const data = await this.threadService.findOne(id);
		return new ApiResponseDto(data);
	}

	@Delete(":id")
	@ApiParam({ name: "id", type: String, required: true })
	@SwaggerApiMessageResponse()
	async deleteOne(@Param("id") id: string) {
		await this.threadService.deleteOne(id);
		return new ApiResponseDto(null, null, "Deleted successfully");
	}
}
