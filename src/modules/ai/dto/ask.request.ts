import { ApiProperty } from "@nestjs/swagger";
import { AIProviderEnum, AIRequestTypeEnum } from "@utils";
import { IsArray, IsIn, IsOptional, IsString, IsUUID } from "class-validator";

export class AskDto {
	@ApiProperty({
		description: "Type of request (chat, suggest, explain, refactor)",
		enum: AIRequestTypeEnum,
	})
	@IsString()
	@IsIn([
		AIRequestTypeEnum.CHAT,
		AIRequestTypeEnum.SUGGEST,
		AIRequestTypeEnum.EXPLAIN,
		AIRequestTypeEnum.REFACTOR,
	])
	requestType: string;

	@ApiProperty({ description: "AI provider to use", enum: AIProviderEnum })
	@IsString()
	@IsIn([AIProviderEnum.OPENAI, AIProviderEnum.GOOGLE])
	provider: AIProviderEnum;

	@ApiProperty({
		description: "If provided, use message content as the prompt",
	})
	@IsUUID()
	messageId: string;

	@ApiProperty({ description: "Natural language prompt to the AI" })
	@IsString()
	@IsOptional()
	prompt?: string;

	@ApiProperty({
		description: "Model identifier for the chosen provider (optional)",
		required: false,
	})
	@IsString()
	@IsOptional()
	model?: string;

	@ApiProperty({
		description: "Optional session id to continue a session",
		required: false,
	})
	@IsUUID()
	@IsOptional()
	sessionId?: string;

	@ApiProperty({
		description: "Optional context objects",
		required: false,
		type: [Object],
	})
	@IsOptional()
	@IsArray()
	context?: Record<string, any>[];
}
