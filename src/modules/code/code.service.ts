import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import {
	RunCodeBlockRequest,
	RunCodeCollabRequest,
	RunCodeRequest,
} from "./dto";
import { CodeExecutionResult, Docker, execMap } from "./code-execution";
import { AiService } from "@modules/ai";
import {
	CodeBlockRepository,
	CodeCollaborationRepository,
	RunCodeCacheRepostiroy,
	SupportedProgrammingLanguageRepository,
} from "@db/repositories";
import { Builder } from "builder-pattern";
import { CheckCodeResponse } from "@modules/ai/dto";
import { ProgrammingLanguageEnum, RunCodeTypeEnum } from "@utils";

@Injectable()
export class CodeService implements OnModuleInit {
	constructor(
		private readonly aiService: AiService,
		private readonly programmingLanguageRepo: SupportedProgrammingLanguageRepository,
		private readonly codeBlockRepo: CodeBlockRepository,
		private readonly codeCollaborationRepo: CodeCollaborationRepository,
		private readonly runCodeCacheRepo: RunCodeCacheRepostiroy,
	) {}

	async onModuleInit() {
		console.log("Preparing code execution containers...");
		const docker = Docker.getInstance();
		await Promise.all(
			Object.values(ProgrammingLanguageEnum).map((lang) =>
				docker.prepareContainer(lang),
			),
		);
	}

	async runCode(dto: RunCodeRequest): Promise<CodeExecutionResult> {
		const language = await this.programmingLanguageRepo.findOne({
			where: { languageCode: dto.language, isActive: true },
		});

		if (
			!language ||
			!language.isExecutable ||
			!execMap[language.languageCode]
		) {
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

	async runCodeBlock(dto: RunCodeBlockRequest): Promise<CodeExecutionResult> {
		const cache = await this.runCodeCacheRepo.findOne({
			where: {
				targetId: dto.codeBlockId,
				runCodeType: RunCodeTypeEnum.CODE_BLOCK,
			},
		});

		if (cache) {
			return Builder<CodeExecutionResult>().output(cache.result).build();
		}

		const codeBlock = await this.codeBlockRepo.findOne({
			where: { id: dto.codeBlockId },
		});

		if (!codeBlock) {
			throw new NotFoundException("Code block not found");
		}

		const language = await this.programmingLanguageRepo.findOne({
			where: { languageCode: codeBlock.language, isActive: true },
		});

		if (
			!language ||
			!language.isExecutable ||
			!execMap[language.languageCode]
		) {
			throw new NotFoundException("Programming language is not executable");
		}

		let aiOutput: CheckCodeResponse;
		try {
			aiOutput = await this.aiService.checkCode(
				language.languageCode,
				codeBlock.content,
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

		const result = await execMap[language.languageCode](codeBlock.content);

		await this.runCodeCacheRepo.insert({
			targetId: dto.codeBlockId,
			runCodeType: RunCodeTypeEnum.CODE_BLOCK,
			result: result.output,
		});

		return result;
	}

	async runCodeCollab(dto: RunCodeCollabRequest): Promise<CodeExecutionResult> {
		const cache = await this.runCodeCacheRepo.findOne({
			where: {
				targetId: dto.codeCollabId,
				runCodeType: RunCodeTypeEnum.CODE_COLLABORATION,
			},
		});

		if (cache) {
			return Builder<CodeExecutionResult>().output(cache.result).build();
		}

		const codeCollab = await this.codeCollaborationRepo.findOne({
			where: { id: dto.codeCollabId },
			relations: { codeBlock: true },
		});

		if (!codeCollab) {
			throw new NotFoundException("Code collaboration not found");
		}

		const language = await this.programmingLanguageRepo.findOne({
			where: { languageCode: codeCollab.codeBlock.language, isActive: true },
		});

		if (
			!language ||
			!language.isExecutable ||
			!execMap[language.languageCode]
		) {
			throw new NotFoundException("Programming language is not executable");
		}

		let aiOutput: CheckCodeResponse;
		try {
			aiOutput = await this.aiService.checkCode(
				language.languageCode,
				codeCollab.content,
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

		const result = await execMap[language.languageCode](codeCollab.content);

		await this.runCodeCacheRepo.insert({
			targetId: dto.codeCollabId,
			runCodeType: RunCodeTypeEnum.CODE_COLLABORATION,
			result: result.output,
		});

		return result;
	}
}
