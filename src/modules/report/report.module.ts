import { Module } from "@nestjs/common";
import { ReportService } from "./report.service";
import { ReportController } from "./report.controller";
import { GroupModule } from "@modules/group";
import { ChannelModule } from "@modules/channel";

@Module({
	providers: [ReportService],
	exports: [ReportService],
	controllers: [ReportController],
	imports: [GroupModule, ChannelModule],
})
export class ReportModule {}
