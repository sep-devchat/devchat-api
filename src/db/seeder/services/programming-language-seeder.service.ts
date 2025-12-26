import {
	SupportedProgrammingLanguageRepository,
	UserRepository,
} from "@db/repositories";
import { Injectable } from "@nestjs/common";
import * as path from "path";
import * as fs from "fs";
import { Env } from "@utils";
import { applySeedTimestampsBulk } from "../utils/seed-date.util";

@Injectable()
export class ProgrammingLanguageSeederService {
	private readonly rawDataPath: string = path.join(
		__dirname,
		"../raw-data/programming-language.json",
	);
	constructor(
		private readonly supportedProgrammingLanguageRepo: SupportedProgrammingLanguageRepository,
		private readonly userRepository: UserRepository,
	) {}

	private async resolveSeederUserId(): Promise<string> {
		if (!Env.ADMIN_USER) {
			throw new Error("ADMIN_USER is not configured in the environment");
		}

		const seederUser = await this.userRepository.findOne({
			select: ["id"],
			where: { email: Env.ADMIN_USER },
		});

		if (!seederUser) {
			throw new Error(
				`Cannot seed programming languages because user ${Env.ADMIN_USER} was not found`,
			);
		}

		return seederUser.id;
	}

	async init() {
		const programmingLanguages =
			await this.supportedProgrammingLanguageRepo.find({
				select: [
					"languageCode",
					"languageName",
					"languageIcon",
					"preset",
					"isExecutable",
					"useAiCheck",
					"isActive",
				],
			});
		fs.writeFileSync(
			this.rawDataPath,
			JSON.stringify(programmingLanguages, null, 2),
			"utf-8",
		);
	}

	async run() {
		const rawData = JSON.parse(
			fs.readFileSync(this.rawDataPath, "utf-8"),
		) as any[];
		const currentLanguages = await this.supportedProgrammingLanguageRepo.find();
		const missingLanguages = rawData.filter(
			(rd) =>
				!currentLanguages.some((cl) => cl.languageCode === rd.languageCode),
		);
		console.log(`Seeding ${missingLanguages.length} programming languages...`);
		if (!missingLanguages.length) {
			return;
		}

		const seederUserId = await this.resolveSeederUserId();
		const languages = this.supportedProgrammingLanguageRepo.create(
			missingLanguages.map((language) => ({
				...language,
				createdBy: seederUserId,
				updatedBy: seederUserId,
			})),
		);
		applySeedTimestampsBulk(languages);
		await this.supportedProgrammingLanguageRepo.save(languages);
	}
}
