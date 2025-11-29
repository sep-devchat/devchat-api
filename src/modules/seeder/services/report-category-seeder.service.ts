import { ReportCategoryRepository } from "@db/repositories";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class ReportCategorySeederService {
	private readonly logger = new Logger(ReportCategorySeederService.name);
	private readonly defaults = [
		{
			name: "Spam",
			description: "Unsolicited or repetitive content disrupting discussions.",
		},
		{
			name: "Harassment",
			description: "Insults, threats, or targeted harassment toward members.",
		},
		{
			name: "Misinformation",
			description:
				"Clearly false or misleading information shared intentionally.",
		},
		{
			name: "Malware",
			description:
				"Links, files, or code blocks attempting to distribute malware.",
		},
	];

	constructor(private readonly reportCategoryRepo: ReportCategoryRepository) {}

	async run() {
		const existing = await this.reportCategoryRepo.find();
		if (existing.length >= this.defaults.length) {
			this.logger.log("Report categories already populated. Skipping seeding.");
			return;
		}

		const existingNames = new Set(existing.map((category) => category.name));
		const categoriesToCreate = this.defaults
			.filter((category) => !existingNames.has(category.name))
			.map((category) => this.reportCategoryRepo.create(category));

		if (!categoriesToCreate.length) {
			this.logger.log("All default report categories already exist.");
			return;
		}

		await this.reportCategoryRepo.save(categoriesToCreate);
		this.logger.log(`Seeded ${categoriesToCreate.length} report categories.`);
	}
}
