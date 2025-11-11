import { ApiProperty } from "@nestjs/swagger";
import { AIProviderEnum } from "@utils";
import { IsIn, IsOptional, IsString, IsUUID } from "class-validator";

export class StartSessionDto {
	@ApiProperty({ description: "Session type (e.g., 'chat', 'code')" })
	@IsString()
	sessionType: string;

	@ApiProperty({ description: "Optional channel id", required: false })
	@IsUUID()
	@IsOptional()
	channelId?: string;

	@ApiProperty({ description: "Optional thread id", required: false })
	@IsUUID()
	@IsOptional()
	threadId?: string;

	@ApiProperty({
		description: "Preferred AI provider for this session",
		required: false,
		enum: AIProviderEnum,
	})
	@IsOptional()
	@IsIn([AIProviderEnum.OPENAI, AIProviderEnum.GEMINI])
	provider?: AIProviderEnum;

	@ApiProperty({
		description: "Preferred model for this session",
		required: false,
	})
	@IsOptional()
	@IsString()
	model?: string;
}
