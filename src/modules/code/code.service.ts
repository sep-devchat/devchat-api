import { Injectable, NotFoundException } from "@nestjs/common";
import { RunCodeRequest } from "./dto";
import { CodeExecutionResult, execMap } from "./code-execution";
import { AiService } from "@modules/ai";
import { SupportedProgrammingLanguageRepository } from "@db/repositories";
import { Builder } from "builder-pattern";
import { CheckCodeResponse } from "@modules/ai/dto";

@Injectable()
export class CodeService {
	constructor(
		private readonly aiService: AiService,
		private readonly programmingLanguageRepo: SupportedProgrammingLanguageRepository,
	) {}

	async runCode(dto: RunCodeRequest): Promise<CodeExecutionResult> {
		const language = await this.programmingLanguageRepo.findOne({
			where: { languageCode: dto.language, isActive: true },
		});

		if (!language) {
			throw new NotFoundException("Programming language not found");
		}

		if (!language.isExecutable || !execMap[language.languageCode]) {
			throw new NotFoundException("Programming language is not executable");
		}

		let aiOutput: CheckCodeResponse;
		try {
			aiOutput = await this.aiService.checkCode(
				language.languageCode,
				dto.code,
			);
		} catch (err) {
			console.error("Error during code check:", err);
		}

		if (aiOutput && !aiOutput.passed) {
			return Builder<CodeExecutionResult>()
				.output(
					`Code check failed. Output from AI:\n${aiOutput.output || "No output provided."}`,
				)
				.build();
		}

		const result = await execMap[language.languageCode](dto.code);
		return result;
	}
}
