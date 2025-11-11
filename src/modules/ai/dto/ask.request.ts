import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString, IsUUID } from "class-validator";

export class AskDto {
	@ApiProperty({
		description: "If provided, use message content as the prompt",
	})
	@IsUUID()
	messageId: string;

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
