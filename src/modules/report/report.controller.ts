import { Controller, Body, Query, Post, Get } from "@nestjs/common";
import { ReportService } from "./report.service";
import {
	CreateReportRequest,
	ReportAnalyticsCategoryQuery,
	ReportAnalyticsRangeQuery,
	ReportAnalyticsReporterQuery,
	ReportAnalyticsSummaryQuery,
	ReportAnalyticsTrendQuery,
	ReportAnalyticsSummaryResponse,
	ReportCategoryStatResponse,
	ReportReporterStatResponse,
	ReportTrendPointResponse,
	ReportTypeDistributionResponse,
	ReportQuery,
	ReportResponse,
} from "./dto";
import {
	AdminRole,
	ApiResponseDto,
	PaginationDto,
	SwaggerApiResponse,
} from "@utils";
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

	@Get("analytics/summary")
	@AdminRole()
	@SwaggerApiResponse(ReportAnalyticsSummaryResponse)
	async getAnalyticsSummary(@Query() query: ReportAnalyticsSummaryQuery) {
		const response = await this.reportService.getSummary(query);
		return new ApiResponseDto(response, null, "Success");
	}

	@Get("analytics/trend")
	@AdminRole()
	@SwaggerApiResponse(ReportTrendPointResponse, { isArray: true })
	async getAnalyticsTrend(@Query() query: ReportAnalyticsTrendQuery) {
		const response = await this.reportService.getTrend(query);
		return new ApiResponseDto(response, null, "Success");
	}

	@Get("analytics/message-types")
	@AdminRole()
	@SwaggerApiResponse(ReportTypeDistributionResponse, { isArray: true })
	async getMessageTypeDistribution(@Query() query: ReportAnalyticsRangeQuery) {
		const response = await this.reportService.getMessageTypeDistribution(query);
		return new ApiResponseDto(response, null, "Success");
	}

	@Get("analytics/categories")
	@AdminRole()
	@SwaggerApiResponse(ReportCategoryStatResponse, { isArray: true })
	async getCategoryBreakdown(@Query() query: ReportAnalyticsCategoryQuery) {
		const response = await this.reportService.getCategoryBreakdown(query);
		return new ApiResponseDto(response, null, "Success");
	}

	@Get("analytics/reporters")
	@AdminRole()
	@SwaggerApiResponse(ReportReporterStatResponse, { isArray: true })
	async getReporterLeaderboard(@Query() query: ReportAnalyticsReporterQuery) {
		const response = await this.reportService.getReporterLeaderboard(query);
		return new ApiResponseDto(response, null, "Success");
	}
}
