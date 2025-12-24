import { ReportCategoryRepository, UserRepository } from "@db/repositories";
import { Injectable } from "@nestjs/common";
import * as path from "path";
import * as fs from "fs";
import { Env } from "@utils";
import { applySeedTimestampsBulk } from "../utils/seed-date.util";

@Injectable()
export class ReportCategorySeederService {
	private readonly rawDataPath: string = path.join(
		__dirname,
		"../raw-data/report-category.json",
	);
	constructor(
		private readonly reportCategoryRepo: ReportCategoryRepository,
		private readonly userRepository: UserRepository,
	) {}

	private async resolveSeederUserId(): Promise<string> {
		if (!Env.EMAIL_USER) {
			throw new Error("EMAIL_USER is not configured in the environment");
		}

		const seederUser = await this.userRepository.findOne({
			select: ["id"],
			where: { email: Env.EMAIL_USER },
		});

		if (!seederUser) {
			throw new Error(
				`Cannot seed report categories because user ${Env.EMAIL_USER} was not found`,
			);
		}

		return seederUser.id;
	}

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
		if (!missingCategories.length) {
			return;
		}

		const seederUserId = await this.resolveSeederUserId();
		const categories = this.reportCategoryRepo.create(
			missingCategories.map((category) => ({
				...category,
				createdBy: seederUserId,
			})),
		);
		applySeedTimestampsBulk(categories);
		await this.reportCategoryRepo.save(categories);
	}
}
