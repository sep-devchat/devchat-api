import { Module } from "@nestjs/common";
import { SeederService } from "./services/seeder.service";
import { DbModule } from "../db.module";
import { ProgrammingLanguageSeederService } from "./services/programming-language-seeder.service";
import { ReportCategorySeederService } from "./services/report-category-seeder.service";
import { UserSeederService } from "./services/user-seeder.service";
import { GroupSeederService } from "./services/group-seeder.service";
import { MessageSeederService } from "./services/message-seeder.service";
import { TaskSeederService } from "./services/task-seeder.service";
import { ReportSeederService } from "./services/report-seeder.service";

@Module({
	providers: [
		SeederService,
		ProgrammingLanguageSeederService,
		ReportCategorySeederService,
		UserSeederService,
		GroupSeederService,
		MessageSeederService,
		TaskSeederService,
		ReportSeederService,
	],
	imports: [DbModule],
})
export class SeederModule {}
