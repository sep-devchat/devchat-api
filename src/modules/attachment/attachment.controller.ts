import {
	Controller,
	Param,
	Query,
	Get,
	UseGuards,
	ParseUUIDPipe,
} from "@nestjs/common";
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

@ApiBearerAuth()
@Controller("direct-message/:targetUserId/attachment")
@ApiParam({ name: "targetUserId", description: "Peer user ID" })
export class DirectAttachmentController {
	constructor(private readonly attachmentService: AttachmentService) {}

	@Get()
	@SwaggerApiResponse(AttachmentResponse, {
		isArray: true,
		withPagination: true,
	})
	async findMany(
		@Param("targetUserId", new ParseUUIDPipe()) targetUserId: string,
		@Query() query: AttachmentQuery,
	) {
		const [entities, count] = await this.attachmentService.findManyForDirect(
			targetUserId,
			query,
		);
		return new ApiResponseDto(
			AttachmentResponse.fromEntities(entities),
			new PaginationDto(query.page, query.size, count),
			"Fetched successfully",
		);
	}

	@Get(":id")
	@SwaggerApiResponse(AttachmentResponse)
	async findOne(
		@Param("targetUserId", new ParseUUIDPipe()) targetUserId: string,
		@Param("id", new ParseUUIDPipe()) id: string,
	) {
		const data = await this.attachmentService.findOneForDirect(
			id,
			targetUserId,
		);
		return new ApiResponseDto(data, null, "Fetched successfully");
	}
}
