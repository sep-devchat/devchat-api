import { Module } from "@nestjs/common";
import { ReportCategoryService } from "./report-category.service";
import { ReportCategoryController } from "./report-category.controller";

@Module({
	providers: [ReportCategoryService],
	exports: [ReportCategoryService],
	controllers: [ReportCategoryController],
})
export class ReportCategoryModule {}
