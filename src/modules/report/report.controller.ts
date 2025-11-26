import { Controller, Body, Query, Post, Get } from "@nestjs/common";
import { ReportService } from "./report.service";
import { CreateReportRequest, ReportQuery, ReportResponse } from "./dto";
import { AdminRole, ApiResponseDto, PaginationDto } from "@utils";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("report")
@ApiBearerAuth()
export class ReportController {
	constructor(private readonly reportService: ReportService) {}

	@Post()
	async createOne(@Body() dto: CreateReportRequest) {
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
}
