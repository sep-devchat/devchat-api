import { ReportCategoryRepository } from "@db/repositories";
import { Injectable } from "@nestjs/common";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class ReportCategorySeederService {
	private readonly rawDataPath: string = path.join(
		__dirname,
		"../raw-data/report-category.json",
	);
	constructor(private readonly reportCategoryRepo: ReportCategoryRepository) {}

	async init() {
		const reportCategories = await this.reportCategoryRepo.find({
			select: ["name", "description", "isRemoved"],
		});

		fs.writeFileSync(
			this.rawDataPath,
			JSON.stringify(reportCategories, null, 2),
			"utf-8",
		);
	}

	async run() {
		const reportCategories = await this.reportCategoryRepo.find({
			select: ["name", "description", "isRemoved"],
		});
		const rawData = JSON.parse(
			fs.readFileSync(this.rawDataPath, "utf-8"),
		) as any[];
		const missingCategories = rawData.filter(
			(rd) => !reportCategories.some((rc) => rc.name === rd.name),
		);
		console.log(`Seeding ${missingCategories.length} report categories...`);
		const categories = this.reportCategoryRepo.create(missingCategories);
		await this.reportCategoryRepo.save(categories);
	}
}
