import {
	ForbiddenException,
	Injectable,
	NotFoundException,
	OnModuleInit,
} from "@nestjs/common";
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
	GroupEntitlementRepository,
	GroupSupportedProgrammingLanguageRepository,
	GroupUsageRepository,
	RunCodeCacheRepostiroy,
	SupportedProgrammingLanguageRepository,
} from "@db/repositories";
import { Builder } from "builder-pattern";
import { CheckCodeResponse } from "@modules/ai/dto";
import { ProgrammingLanguageEnum, RunCodeTypeEnum } from "@utils";
import { Brackets } from "typeorm";

const billingCycleKeyOf = (d: Date) => {
	const yyyy = d.getUTCFullYear();
	const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
	return `${yyyy}-${mm}`;
};

const monthBoundsUtc = (d: Date) => {
	const start = new Date(
		Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0),
	);
	const end = new Date(
		Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 0, 0, 0),
	);
	return { start, end };
};

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
		private readonly groupEntitlementRepo: GroupEntitlementRepository,
		private readonly groupUsageRepo: GroupUsageRepository,
	) {}

	private async getCurrentGroupEntitlement(groupId: string, now: Date) {
		return await this.groupEntitlementRepo
			.createQueryBuilder("ge")
			.where("ge.groupId = :groupId", { groupId })
			.andWhere("ge.effectiveFrom <= :now", { now })
			.andWhere(
				new Brackets((qb) => {
					qb.where("ge.effectiveTo IS NULL").orWhere("ge.effectiveTo > :now", {
						now,
					});
				}),
			)
			.orderBy("ge.effectiveFrom", "DESC")
			.getOne();
	}

	private async getOrCreateCurrentGroupUsage(groupId: string, now: Date) {
		const billingCycleKey = billingCycleKeyOf(now);
		let usage = await this.groupUsageRepo.findOneBy({
			groupId,
			billingCycleKey,
		});
		if (usage) return usage;

		const { start: periodStart, end: periodEnd } = monthBoundsUtc(now);
		try {
			await this.groupUsageRepo.insert(
				this.groupUsageRepo.create({
					groupId,
					billingCycleKey,
					periodStart,
					periodEnd,
					messagesSent: 0,
					fileBytesUploaded: "0",
					runCodeExecutions: 0,
					aiTokensConsumed: "0",
				}),
			);
		} catch {
			// Ignore race (unique index), will fetch below.
		}
		usage = await this.groupUsageRepo.findOneBy({ groupId, billingCycleKey });
		if (!usage) {
			throw new NotFoundException("Group usage not found");
		}
		return usage;
	}

	private async assertGroupCanRunCode(groupId: string, now: Date) {
		const [entitlement, usage] = await Promise.all([
			this.getCurrentGroupEntitlement(groupId, now),
			this.getOrCreateCurrentGroupUsage(groupId, now),
		]);

		const runCodePerDay = Number(
			(entitlement as any)?.entitlements?.limits?.runCodePerDay ?? 0,
		);
		const limit = Number.isFinite(runCodePerDay) ? runCodePerDay : 0;

		// limit <= 0 means not allowed.
		if (limit <= 0) {
			throw new ForbiddenException("Run code is not allowed for this group");
		}
		if ((usage.runCodeExecutions ?? 0) >= limit) {
			throw new ForbiddenException("Run code limit reached for this group");
		}

		return usage;
	}

	private async increaseRunCodeExecutions(usageId: string) {
		await this.groupUsageRepo.increment(
			{ id: usageId },
			"runCodeExecutions",
			1,
		);
	}

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

		let usageIdToIncrement: string | null = null;
		if (codeBlock.channelId) {
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

			// Check usage limit from current entitlement snapshot
			const now = new Date();
			const usage = await this.assertGroupCanRunCode(channel.group.id, now);
			usageIdToIncrement = usage.id;
		}

		const cache = await this.runCodeCacheRepo.findOne({
			where: {
				targetId: dto.codeBlockId,
				runCodeType: RunCodeTypeEnum.CODE_BLOCK,
			},
		});

		if (cache) {
			if (usageIdToIncrement) {
				await this.increaseRunCodeExecutions(usageIdToIncrement);
			}
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

				if (usageIdToIncrement) {
					await this.increaseRunCodeExecutions(usageIdToIncrement);
				}
				return Builder<CodeExecutionResult>().output(output).build();
			}
		}

		try {
			const result = await execMap[language.languageCode](codeBlock.content);

			await this.runCodeCacheRepo.insert({
				targetId: dto.codeBlockId,
				runCodeType: RunCodeTypeEnum.CODE_BLOCK,
				result: result.output,
			});

			return result;
		} finally {
			if (usageIdToIncrement) {
				await this.increaseRunCodeExecutions(usageIdToIncrement);
			}
		}
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
