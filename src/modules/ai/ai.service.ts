import { Injectable } from "@nestjs/common";
import {
	AiInteractionRepository,
	AiSessionRepository,
	MessageRepository,
} from "@db/repositories";
import { AiInteractionEntity, AiSessionEntity } from "@db/entities";
import { ClsService } from "nestjs-cls";
import { AIProviderEnum, AIRequestTypeEnum, DevChatCls, Env } from "@utils";
import { AskDto, StartSessionDto } from "./dto";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
	GoogleKeyMissingError,
	NoLLMConfiguredError,
	OpenAIKeyMissingError,
	MessageNotFoundError,
	MissingPromptOrMessageError,
} from "./errors";
import { buildPrompt } from "./ai.prompt";

type ModelProvider = AIProviderEnum;

@Injectable()
export class AiService {
	constructor(
		private readonly sessions: AiSessionRepository,
		private readonly interactions: AiInteractionRepository,
		private readonly messages: MessageRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

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
		const userId = this.cls.get("profile")?.id ?? null;
		let session: AiSessionEntity | null = null;
		if (dto.sessionId) {
			session = await this.sessions.findOne({ where: { id: dto.sessionId } });
		}
		if (!session) {
			session = await this.startSession({
				sessionType: "chat",
				provider: undefined,
				model: dto.model,
			});
		}

		// Resolve input message and parse provider/requestType from its content
		if (!dto.messageId) {
			throw new MissingPromptOrMessageError();
		}
		const msg = await this.messages.findOne({ where: { id: dto.messageId } });
		if (!msg) throw new MessageNotFoundError(dto.messageId);
		const raw = (msg.content || "").trim();
		// Pattern: @<provider>/<requestType> rest of message
		// provider: openai|gemini (map gemini->AIProviderEnum.GEMINI), requestType matches AIRequestTypeEnum
		let parsedProvider: ModelProvider | undefined;
		let parsedType: AIRequestTypeEnum = AIRequestTypeEnum.CHAT;
		let strippedInput = raw;
		const m = raw.match(/^@([a-zA-Z0-9_-]+)\/(\w+)\s+(.*)$/);
		if (m) {
			const prov = m[1].toLowerCase();
			const typ = m[2].toLowerCase();
			strippedInput = m[3];
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
		if (!inputText) throw new MissingPromptOrMessageError();

		const prompt = buildPrompt(parsedType);
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

		// Save AI response as a new message in the same channel/thread as the input message
		await this.messages.insert({
			channelId: msg.channelId,
			threadId: msg.threadId ?? null,
			parentMessageId: dto.messageId,
			senderId: userId || this.cls.get("profile")?.id || "system",
			content: answer,
		});

		return { session, interaction, answer };
	}
}
