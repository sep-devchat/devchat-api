import {
	Controller,
	Param,
	Body,
	Query,
	Post,
	Get,
	Delete,
	UseGuards,
} from "@nestjs/common";
import { ReportService } from "./report.service";
import { CreateReportRequest, ReportQuery, ReportResponse } from "./dto";
import { AdminRole, ApiResponseDto, PaginationDto } from "@utils";
import { ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { GroupGuard } from "@modules/group";
import { ChannelGuard } from "@modules/channel";

@Controller("report")
@ApiBearerAuth()
export class ReportController {
	constructor(private readonly reportService: ReportService) {}

	@Post()
	@UseGuards(GroupGuard, ChannelGuard)
	@ApiQuery({ name: "groupId", description: "Group ID", required: true })
	@ApiQuery({ name: "channelId", description: "Channel ID", required: true })
	async createOne(
		@Query("groupId") groupId: string,
		@Query("channelId") channelId: string,
		@Body() dto: CreateReportRequest,
	) {
		await this.reportService.createOne(dto);
		return new ApiResponseDto(null, null, "Created successfully");
	}

	@Get()
	@AdminRole()
	async findMany(@Query() query: ReportQuery) {
		const { data, total } = await this.reportService.findMany(query);
		return new ApiResponseDto(
			ReportResponse.fromEntities(data),
			new PaginationDto(query.page, query.limit, total),
			"Success",
		);
	}

	@Get(":id")
	@AdminRole()
	async findOne(@Param("id") id: string) {
		const data = await this.reportService.findOne(id);
		return new ApiResponseDto(data);
	}

	@Delete(":id")
	@AdminRole()
	async deleteOne(@Param("id") id: string) {
		await this.reportService.deleteOne(id);
		return new ApiResponseDto(null, null, "Deleted successfully");
	}
}
