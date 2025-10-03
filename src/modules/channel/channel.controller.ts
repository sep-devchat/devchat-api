import {
	Controller,
	Param,
	Body,
	Post,
	Get,
	Put,
	Delete,
	UseGuards,
} from "@nestjs/common";
import { ChannelService } from "./channel.service";
import {
	ChannelResponse,
	CreateChannelRequest,
	UpdateChannelRequest,
} from "./dto";
import { ApiResponseDto } from "@utils";
import { ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { GroupGuard } from "@modules/group";
import { ChannelGuard } from "./channel.guard";

@Controller("group/:groupId/channel")
@ApiParam({ name: "groupId", type: String, required: true })
@ApiBearerAuth()
@UseGuards(GroupGuard)
export class ChannelController {
	constructor(private readonly channelService: ChannelService) {}

	@Post()
	async createOne(@Body() dto: CreateChannelRequest) {
		await this.channelService.createOne(dto);
		return new ApiResponseDto(null, null, "Created successfully");
	}

	@Put(":id")
	@ApiParam({ name: "id", type: String, required: true })
	@UseGuards(ChannelGuard)
	async updateOne(@Param("id") id: string, @Body() dto: UpdateChannelRequest) {
		await this.channelService.updateOne(id, dto);
		return new ApiResponseDto(null, null, "Updated successfully");
	}

	@Get()
	async findMany() {
		const data = await this.channelService.findMany();
		return new ApiResponseDto(
			ChannelResponse.fromEntities(data),
			null,
			"Fetched successfully",
		);
	}

	@Get(":id")
	@ApiParam({ name: "id", type: String, required: true })
	@UseGuards(ChannelGuard)
	async findOne(@Param("id") id: string) {
		const data = await this.channelService.findOne(id);
		return new ApiResponseDto(
			ChannelResponse.fromEntity(data),
			null,
			"Fetched successfully",
		);
	}

	@Delete(":id")
	@ApiParam({ name: "id", type: String, required: true })
	@UseGuards(ChannelGuard)
	async deleteOne(@Param("id") id: string) {
		await this.channelService.deleteOne(id);
		return new ApiResponseDto(null, null, "Deleted successfully");
	}
}
