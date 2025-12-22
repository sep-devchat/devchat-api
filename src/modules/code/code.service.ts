import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import {
	RunCodeBlockRequest,
	RunCodeCollabRequest,
	RunCodeRequest,
} from "./dto";
import { CodeExecutionResult, Docker, execMap } from "./code-execution";
import { AiService } from "@modules/ai";
import {
	ChannelRepository,
	CodeBlockRepository,
	CodeCollaborationRepository,
	GroupRepository,
	GroupSupportedProgrammingLanguageRepository,
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
		private readonly groupRepo: GroupRepository,
		private readonly channelRepo: ChannelRepository,
		private readonly groupLanguageRepo: GroupSupportedProgrammingLanguageRepository,
	) {}

	async onModuleInit() {
		console.log("Preparing code execution containers...");
		const docker = Docker.getInstance();

		for (const lang of Object.values(ProgrammingLanguageEnum)) {
			try {
				await docker.prepareContainer(lang);
				console.log(`Container for ${lang} is ready.`);
			} catch (err) {
				console.error(`Error preparing container for ${lang}:`, err);
			}
		}
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

		if (language.useAiCheck) {
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
		}

		const result = await execMap[language.languageCode](dto.code);
		return result;
	}

	async runCodeBlock(dto: RunCodeBlockRequest): Promise<CodeExecutionResult> {
		const codeBlock = await this.codeBlockRepo.findOne({
			where: { id: dto.codeBlockId },
		});

		if (!codeBlock) {
			throw new NotFoundException("Code block not found");
		}

		// Verify that the code block's language is allowed in its group
		const channel = await this.channelRepo.findOne({
			where: { id: codeBlock.channelId },
			relations: { group: true },
		});

		if (!channel) {
			throw new NotFoundException("Channel not found for the code block");
		}

		const groupLanguage = await this.groupLanguageRepo.find({
			where: {
				groupId: channel.group.id,
			},
			relations: { supportedProgrammingLanguage: true },
		});
		console.log("Group supported languages:", groupLanguage);

		const allowLanguage = groupLanguage.some(
			(gl) =>
				gl.isActive &&
				gl.supportedProgrammingLanguage.languageCode === codeBlock.language,
		);

		if (!allowLanguage) {
			throw new NotFoundException(
				"Programming language is not supported in this group",
			);
		}

		const cache = await this.runCodeCacheRepo.findOne({
			where: {
				targetId: dto.codeBlockId,
				runCodeType: RunCodeTypeEnum.CODE_BLOCK,
			},
		});

		if (cache) {
			return Builder<CodeExecutionResult>().output(cache.result).build();
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

		if (language.useAiCheck) {
			console.log("Running AI code check for code block...");
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
				const output = `Code check failed. Output from AI:\n${aiOutput.output || "No output provided."}`;

				await this.runCodeCacheRepo.insert({
					targetId: dto.codeBlockId,
					runCodeType: RunCodeTypeEnum.CODE_BLOCK,
					result: output,
				});

				return Builder<CodeExecutionResult>().output(output).build();
			}
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

		if (language.useAiCheck) {
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
				const output = `Code check failed. Output from AI:\n${aiOutput.output || "No output provided."}`;

				await this.runCodeCacheRepo.insert({
					targetId: dto.codeCollabId,
					runCodeType: RunCodeTypeEnum.CODE_COLLABORATION,
					result: output,
				});

				return Builder<CodeExecutionResult>().output(output).build();
			}
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
