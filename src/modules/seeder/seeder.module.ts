import { DbModule } from "@db";
import { Module } from "@nestjs/common";
import { SeederService } from "./seeder.service";
import {
	MessageSeederService,
	ThreadSeederService,
	ChannelSeederService,
	GroupSeederService,
	UserSeederService,
	TaskSeederService,
	ReportCategorySeederService,
	ReportSeederService,
	CodeCollaborationSeederService,
	NotificationSeederService,
} from "./services";

@Module({
	imports: [DbModule],
	providers: [
		SeederService,
		UserSeederService,
		GroupSeederService,
		ChannelSeederService,
		ThreadSeederService,
		MessageSeederService,
		TaskSeederService,
		ReportCategorySeederService,
		ReportSeederService,
		CodeCollaborationSeederService,
		NotificationSeederService,
	],
})
export class SeederModule {}
