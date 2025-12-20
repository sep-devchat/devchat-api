import { Injectable } from "@nestjs/common";
import {
	AiInteractionRepository,
	AiSessionRepository,
	ChannelRepository,
	GroupSubscriptionRepository,
	MessageRepository,
} from "@db/repositories";
import { AiInteractionEntity, AiSessionEntity } from "@db/entities";
import { ClsService } from "nestjs-cls";
import { AIProviderEnum, AIRequestTypeEnum, DevChatCls, Env } from "@utils";
import { AskDto, CheckCodeResponse, StartSessionDto } from "./dto";
import { createAgent, HumanMessage } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
	GoogleKeyMissingError,
	NoLLMConfiguredError,
	OpenAIKeyMissingError,
	MessageNotFoundError,
	MissingPromptOrMessageError,
	AiNotEnabledForGroupError,
} from "./errors";
import { buildPrompt, CHECK_CODE_SYSTEM_PROMPT } from "./ai.prompt";
import z from "zod/v3";
import { Builder } from "builder-pattern";
import { GroupService } from "@modules/group";

type ModelProvider = AIProviderEnum;

@Injectable()
export class AiService {
	constructor(
		private readonly sessions: AiSessionRepository,
		private readonly interactions: AiInteractionRepository,
		private readonly messages: MessageRepository,
		private readonly channels: ChannelRepository,
		private readonly groupSubscriptions: GroupSubscriptionRepository,
		private readonly groupService: GroupService,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	private pickCurrentGroupSubscription<
		T extends {
			groupSubscriptionStatus: string;
			startedAt: Date | null;
			endedAt: Date | null;
			subscription?: {
				levelSubscription?: number | null;
				isAIActive?: boolean;
			} | null;
		},
	>(items: T[]): T | null {
		if (!items?.length) return null;
		const now = new Date();
		const levelOf = (s: T) => Number(s.subscription?.levelSubscription ?? 0);
		const startedAtTimeOf = (s: T) => (s.startedAt ? s.startedAt.getTime() : 0);

		const isActiveStatus = (s: T) => s.groupSubscriptionStatus === "active";
		const isStarted = (s: T) => !s.startedAt || s.startedAt <= now;
		const notEnded = (s: T) => !s.endedAt || s.endedAt >= now;

		const activeNow = items.filter(
			(s) => isActiveStatus(s) && isStarted(s) && notEnded(s),
		);
		const activeAny = items.filter((s) => isActiveStatus(s));

		const pickHighestLevel = (candidates: T[]) => {
			if (!candidates.length) return null;
			return candidates.reduce<T>((best, cur) => {
				const bestLevel = levelOf(best);
				const curLevel = levelOf(cur);
				if (curLevel !== bestLevel) return curLevel > bestLevel ? cur : best;
				return startedAtTimeOf(cur) > startedAtTimeOf(best) ? cur : best;
			}, candidates[0]);
		};

		return (
			pickHighestLevel(activeNow) ??
			pickHighestLevel(activeAny) ??
			pickHighestLevel(items)
		);
	}

	private async assertGroupCanUseAi(groupId: string) {
		// Preferred: use GroupService getter (includes access validation when CLS is available)
		const clsUserId = this.cls.get("profile")?.id;
		if (clsUserId) {
			const { currentSubscription } =
				await this.groupService.findSubscriptionsInGroup(groupId);
			if (!currentSubscription?.subscription?.isAIActive) {
				throw new AiNotEnabledForGroupError(
					currentSubscription ? "ai_disabled" : "missing_subscription",
				);
			}
			return;
		}

		// Fallback (no CLS context, e.g. socket-driven): do a direct check.
		const records = await this.groupSubscriptions.find({
			where: { groupId },
			relations: { subscription: true },
			order: { startedAt: "DESC" },
		});
		const current = this.pickCurrentGroupSubscription(records);
		if (!current?.subscription) {
			throw new AiNotEnabledForGroupError("missing_subscription");
		}
		if (!current.subscription.isAIActive) {
			throw new AiNotEnabledForGroupError("ai_disabled");
		}
	}

	listProviders() {
		const providers = [] as {
			provider: AIProviderEnum;
			label: string;
			available: boolean;
			configuredModel?: string | null;
			fallbackModel?: string | null;
		}[];
		// OPENAI
		providers.push({
			provider: AIProviderEnum.OPENAI,
			label: "OpenAI",
			available: !!Env.OPENAI_API_KEY,
			configuredModel: Env.OPENAI_MODEL || null,
			fallbackModel: "gpt-4o-mini",
		});
		// GEMINI (Google)
		providers.push({
			provider: AIProviderEnum.GEMINI,
			label: "Google Gemini",
			available: !!Env.GOOGLE_API_KEY,
			configuredModel: Env.GOOGLE_MODEL || null,
			fallbackModel: "gemini-1.5-flash",
		});
		return providers;
	}

	private getModel(
		provider?: ModelProvider,
		modelOverride?: string,
	): { provider: ModelProvider; model: any } {
		const openaiKey = Env.OPENAI_API_KEY;
		const googleKey = Env.GOOGLE_API_KEY;

		if (provider === AIProviderEnum.OPENAI) {
			if (!openaiKey) throw new OpenAIKeyMissingError();
			const model = new ChatOpenAI({
				apiKey: openaiKey,
				model: modelOverride || Env.OPENAI_MODEL || "gpt-4o-mini",
			});
			return { provider: AIProviderEnum.OPENAI, model };
		}
		if (provider === AIProviderEnum.GEMINI) {
			if (!googleKey) throw new GoogleKeyMissingError();
			const model = new ChatGoogleGenerativeAI({
				apiKey: googleKey,
				model: modelOverride || Env.GOOGLE_MODEL || "gemini-1.5-flash",
			});
			return { provider: AIProviderEnum.GEMINI, model };
		}

		// Auto-pick when not provided
		if (openaiKey) {
			const model = new ChatOpenAI({
				apiKey: openaiKey,
				model: Env.OPENAI_MODEL || "gpt-4o-mini",
			});
			return { provider: AIProviderEnum.OPENAI, model };
		}
		if (googleKey) {
			const model = new ChatGoogleGenerativeAI({
				apiKey: googleKey,
				model: Env.GOOGLE_MODEL || "gemini-1.5-flash",
			});
			return { provider: AIProviderEnum.GEMINI, model };
		}
		throw new NoLLMConfiguredError();
	}

	async startSession(dto: StartSessionDto): Promise<AiSessionEntity> {
		const userId = this.cls.get("profile")?.id;
		const session = this.sessions.create({
			userId,
			channelId: dto.channelId ?? null,
			threadId: dto.threadId ?? null,
			sessionType: dto.sessionType,
			startedAt: new Date(),
			endedAt: null,
			status: "active",
			// store provider/model if your schema supports it (could be part of contextData in future)
		});
		return await this.sessions.save(session);
	}

	async ask(dto: AskDto): Promise<{
		session: AiSessionEntity;
		interaction: AiInteractionEntity;
		answer: string;
	}> {
		// Resolve input message and parse provider/requestType from its content
		if (!dto.messageId) {
			throw new MissingPromptOrMessageError();
		}
		const msg = await this.messages.findOne({
			where: { id: dto.messageId },
			relations: { thread: true },
		});
		if (!msg) throw new MessageNotFoundError();

		// Validate group subscription allows AI.
		const channel = await this.channels.findOne({
			where: { id: msg.channelId },
		});
		const groupId = channel?.groupId;
		if (!groupId) throw new AiNotEnabledForGroupError("missing_group_context");
		await this.assertGroupCanUseAi(String(groupId));

		// Determine user context: prefer current CLS user, fallback to message sender
		const userId = this.cls.get("profile")?.id ?? msg.senderId ?? null;

		// Ensure we have a session; when invoked via socket there is no CLS request context,
		// so we must create the session with explicit user/channel/thread from the message.
		let session: AiSessionEntity | null = null;
		if (dto.sessionId) {
			session = await this.sessions.findOne({ where: { id: dto.sessionId } });
		}
		if (!session) {
			const newSession = this.sessions.create({
				userId: userId!,
				channelId: msg.channelId ?? null,
				threadId: msg.thread?.id ?? null,
				sessionType: "chat",
				startedAt: new Date(),
				endedAt: null,
				status: "active",
			});
			session = await this.sessions.save(newSession);
		}
		const raw = (msg.content || "").trim();
		// Pattern: @<provider>/<requestType> rest of message
		// provider: openai|gemini (map gemini->AIProviderEnum.GEMINI), requestType matches AIRequestTypeEnum
		let parsedProvider: ModelProvider | undefined;
		let parsedType: AIRequestTypeEnum = AIRequestTypeEnum.CHAT;
		let strippedInput = raw;
		const splitOnce = (input: string) => {
			const index = input.indexOf(" ");
			if (index === -1) return [input, ""];
			return [input.substring(0, index), input.substring(index + 1)];
		};
		const splitInput = splitOnce(raw);
		const m = splitInput[0].match(/^@([a-zA-Z0-9_-]+)\/(\w+)(?:\s+(.*))?$/);
		if (m) {
			const prov = m[1].toLowerCase();
			const typ = m[2].toLowerCase();
			strippedInput = splitInput[1] ?? "";
			console.log(
				`[AiService] Parsed AI ask directive: provider=${prov}, type=${typ}`,
			);
			// map provider
			if (prov === "openai") parsedProvider = AIProviderEnum.OPENAI;
			if (prov === "google" || prov === "gemini")
				parsedProvider = AIProviderEnum.GEMINI;
			// map type
			switch (typ) {
				case "suggest":
					parsedType = AIRequestTypeEnum.SUGGEST;
					break;
				case "explain":
					parsedType = AIRequestTypeEnum.EXPLAIN;
					break;
				case "refactor":
					parsedType = AIRequestTypeEnum.REFACTOR;
					break;
				case "chat":
				default:
					parsedType = AIRequestTypeEnum.CHAT;
			}
		}

		const { model } = this.getModel(parsedProvider, dto.model);

		// Input text is the stripped content after any @provider/type directive
		const inputText = strippedInput.trim();
		console.log(`[AiService] Using input text: ${inputText}`);
		if (!inputText) throw new MissingPromptOrMessageError();

		const prompt = buildPrompt(
			parsedType,
			inputText,
			dto.context ? JSON.stringify(dto.context, null, 2) : undefined,
		);
		const chain = prompt.pipe(model);
		const vars = {
			input: inputText,
			context: dto.context ? JSON.stringify(dto.context, null, 2) : "",
		};

		const start = Date.now();
		const completion = await chain.invoke(vars);
		const end = Date.now();

		const answer: string = (() => {
			if (typeof completion === "string") return completion;
			const anyComp: any = completion as any;
			if (typeof anyComp?.content === "string") return anyComp.content;
			if (typeof anyComp?.text === "string") return anyComp.text;
			// some LangChain messages return array content; try to join
			if (Array.isArray(anyComp?.content)) {
				try {
					return anyComp.content
						.map((c: any) => c?.text ?? "")
						.join("")
						.trim();
				} catch {}
			}
			return JSON.stringify(anyComp);
		})();

		const interaction = this.interactions.create({
			sessionId: session.id,
			messageId: dto.messageId ?? null,
			aiResponse: answer,
			model: dto.model ?? model?.modelName ?? model?.model ?? null,
			contextData: dto.context ? { items: dto.context } : null,
			responseTime: end - start,
			createdBy: userId || "system",
			isActive: true,
		});
		await this.interactions.insert(interaction);

		// Do NOT insert AI answer message here anymore; let SocketService handle broadcast & persistence
		return { session, interaction, answer };
	}

	async checkCode(language: string, code: string) {
		const agent = createAgent({
			model: "google-genai:gemini-2.5-flash",
			systemPrompt: CHECK_CODE_SYSTEM_PROMPT,
			responseFormat: z.object({
				output: z.string().optional(),
				passed: z.boolean(),
			}),
		});

		let response = await new Promise<any>((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error("Code check timed out after 10 seconds"));
			}, 10000);

			agent
				.invoke({
					messages: [new HumanMessage(JSON.stringify({ language, code }))],
				})
				.then((res) => {
					clearTimeout(timeout);
					resolve(res);
				})
				.catch((err) => {
					clearTimeout(timeout);
					reject(err);
				});
		});

		return Builder(CheckCodeResponse)
			.output(response.structuredResponse.output || "")
			.passed(response.structuredResponse.passed || false)
			.build();
	}
}
