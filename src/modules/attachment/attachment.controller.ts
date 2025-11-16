import { Controller, Param, Query, Get, UseGuards } from "@nestjs/common";
import { AttachmentService } from "./attachment.service";
import { AttachmentQuery } from "./dto";
import { ApiResponseDto, PaginationDto, SwaggerApiResponse } from "@utils";
import { AttachmentResponse } from "./dto";
import { ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { GroupGuard } from "@modules/group";
import { ChannelGuard } from "@modules/channel";

@ApiBearerAuth()
@Controller("group/:groupId/channel/:channelId/attachment")
@UseGuards(GroupGuard, ChannelGuard)
@ApiParam({ name: "groupId", description: "Group ID" })
@ApiParam({ name: "channelId", description: "Channel ID" })
export class AttachmentController {
	constructor(private readonly attachmentService: AttachmentService) {}

	@Get()
	@SwaggerApiResponse(AttachmentResponse, {
		isArray: true,
		withPagination: true,
	})
	async findMany(@Query() query: AttachmentQuery) {
		const [entities, count] = await this.attachmentService.findMany(query);
		return new ApiResponseDto(
			AttachmentResponse.fromEntities(entities),
			new PaginationDto(query.page, query.size, count),
			"Fetched successfully",
		);
	}

	@Get(":id")
	@SwaggerApiResponse(AttachmentResponse)
	async findOne(@Param("id") id: string) {
		const data = await this.attachmentService.findOne(id);
		return new ApiResponseDto(data, null, "Fetched successfully");
	}
}
