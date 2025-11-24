import { CreateCodeBlockRequest } from "@modules/code-block/dto";
import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";

export class SendMessageRequest {
	@IsString()
	@IsOptional()
	parentMessageId?: string;

	@IsString()
	content: string;

	@IsString({ each: true })
	@IsArray()
	@IsOptional()
	attachmentIds?: string[];

	@ValidateNested()
	@Type(() => CreateCodeBlockRequest)
	@IsOptional()
	codeBlock?: CreateCodeBlockRequest;
}
