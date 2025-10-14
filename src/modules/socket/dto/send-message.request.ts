import { IsOptional, IsString } from "class-validator";

export class SendMessageRequest {
	@IsString()
	@IsOptional()
	threadId?: string;

	@IsString()
	@IsOptional()
	parentMessageId?: string;

	@IsString()
	content: string;
}
