import { Injectable } from "@nestjs/common";
import { ProgrammingLanguageSeederService } from "./programming-language-seeder.service";
import { ReportCategorySeederService } from "./report-category-seeder.service";
import { UserSeederService } from "./user-seeder.service";
import { GroupSeederService } from "./group-seeder.service";
import { GroupSubscriptionSeederService } from "./group-subscription-seeder.service";
import { MessageSeederService } from "./message-seeder.service";
import { TaskSeederService } from "./task-seeder.service";
import { ReportSeederService } from "./report-seeder.service";

@Injectable()
export class SeederService {
	constructor(
		private readonly prograrmingLanguageSeederService: ProgrammingLanguageSeederService,
		private readonly reportCategorySeederService: ReportCategorySeederService,
		private readonly userSeederService: UserSeederService,
		private readonly groupSeederService: GroupSeederService,
		private readonly groupSubscriptionSeederService: GroupSubscriptionSeederService,
		private readonly messageSeederService: MessageSeederService,
		private readonly taskSeederService: TaskSeederService,
		private readonly reportSeederService: ReportSeederService,
	) {}

	async init() {
		console.log("Initializing seeder...");

		await this.prograrmingLanguageSeederService.init();
		await this.reportCategorySeederService.init();

		console.log("Seeder initialized.");
	}

	async run() {
		console.log("Seeding database...");
		// Add seeding logic here

		await this.prograrmingLanguageSeederService.run();
		await this.reportCategorySeederService.run();
		await this.userSeederService.run();
		await this.groupSeederService.run();
		await this.groupSubscriptionSeederService.run();
		await this.messageSeederService.run();
		await this.taskSeederService.run();
		await this.reportSeederService.run();

		console.log("Database seeded successfully.");
	}
}
