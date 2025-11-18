import { Controller, Query, Get, UseGuards, Param } from "@nestjs/common";
import { CodeBlockService } from "./code-block.service";
import { CodeBlockQuery, CodeBlockResponse } from "./dto";
import { ApiResponseDto, PaginationDto, SwaggerApiResponse } from "@utils";
import { ApiBearerAuth, ApiOperation, ApiParam } from "@nestjs/swagger";
import { GroupGuard } from "@modules/group";
import { ChannelGuard } from "@modules/channel";

@Controller("group/:groupId/channel/:channelId/code-block")
@ApiBearerAuth()
@ApiParam({ name: "groupId", description: "Group ID" })
@ApiParam({ name: "channelId", description: "Channel ID" })
@UseGuards(GroupGuard, ChannelGuard)
export class CodeBlockController {
	constructor(private readonly codeBlockService: CodeBlockService) {}

	@Get()
	@ApiOperation({ summary: "Get all code blocks" })
	@SwaggerApiResponse(CodeBlockResponse, {
		withPagination: true,
		isArray: true,
	})
	async findMany(@Query() query: CodeBlockQuery) {
		const [entities, count] = await this.codeBlockService.findMany(query);
		return new ApiResponseDto(
			CodeBlockResponse.fromEntities(entities),
			new PaginationDto(query.page, query.limit, count),
			"Code blocks retrieved successfully",
		);
	}

	@Get(":id")
	@SwaggerApiResponse(CodeBlockResponse)
	async findOne(@Param("id") id: string) {
		const data = await this.codeBlockService.findOne(id);
		return new ApiResponseDto(
			CodeBlockResponse.fromEntity(data),
			undefined,
			"Code block retrieved successfully",
		);
	}
}
