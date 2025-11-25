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
import { ReportCategoryService } from "./report-category.service";
import {
	CreateReportCategoryRequest,
	UpdateReportCategoryRequest,
	ReportCategoryQuery,
	ReportCategoryAdminQuery,
} from "./dto";
import { AdminRole, ApiResponseDto } from "@utils";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("report-category")
@ApiBearerAuth()
export class ReportCategoryController {
	constructor(private readonly reportCategoryService: ReportCategoryService) {}

	@Post()
	@AdminRole()
	async createOne(@Body() dto: CreateReportCategoryRequest) {
		await this.reportCategoryService.createOne(dto);
		return new ApiResponseDto(null, null, "Created successfully");
	}

	@Put(":id")
	@AdminRole()
	async updateOne(
		@Param("id") id: string,
		@Body() dto: UpdateReportCategoryRequest,
	) {
		await this.reportCategoryService.updateOne(id, dto);
		return new ApiResponseDto(null, null, "Updated successfully");
	}

	@Get("admin")
	@AdminRole()
	async findManyAdmin(@Query() query: ReportCategoryAdminQuery) {
		const { data, pagination } =
			await this.reportCategoryService.findManyAdmin(query);
		return new ApiResponseDto(data, pagination);
	}

	@Get()
	async findMany(@Query() query: ReportCategoryQuery) {
		const data = await this.reportCategoryService.findMany(query);
		return new ApiResponseDto(data);
	}

	@Delete(":id")
	@AdminRole()
	async deleteOne(@Param("id") id: string) {
		const data = await this.reportCategoryService.deleteOne(id);
		const message = data.isRemoved
			? "Archived successfully"
			: "Restored successfully";
		return new ApiResponseDto(data, null, message);
	}
}
