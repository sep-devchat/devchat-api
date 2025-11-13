import {
	IsOptional,
	IsString,
	IsUUID,
	IsArray,
	ArrayMaxSize,
} from "class-validator";

export class SendMessageRequest {
	@IsString()
	@IsOptional()
	threadId?: string;

	@IsString()
	@IsOptional()
	parentMessageId?: string;

	@IsString()
	content: string;

	@IsArray()
	@IsUUID("4", { each: true })
	@ArrayMaxSize(10)
	@IsOptional()
	attachmentIds?: string[]; // IDs of previously uploaded attachments to associate

	@IsUUID("4")
	@IsOptional()
	codeBlockId?: string; // optional existing code block to associate
}
