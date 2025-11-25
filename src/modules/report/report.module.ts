import { Module } from "@nestjs/common";
import { ReportService } from "./report.service";
import { ReportController } from "./report.controller";

@Module({
	providers: [ReportService],
	exports: [ReportService],
	controllers: [ReportController],
	imports: [],
})
export class ReportModule {}
