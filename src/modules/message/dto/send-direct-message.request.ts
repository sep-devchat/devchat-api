import { CreateCodeBlockRequest } from "@modules/code-block/dto";
import { Type } from "class-transformer";
import {
	IsUUID,
	IsString,
	IsOptional,
	IsArray,
	ValidateNested,
} from "class-validator";

export class SendDirectMessageRequest {
	@IsUUID()
	toUserId: string;

	@IsString()
	content: string;

	@IsUUID()
	@IsOptional()
	parentMessageId?: string;

	@IsString({ each: true })
	@IsArray()
	@IsOptional()
	attachmentIds?: string[];

	@ValidateNested()
	@Type(() => CreateCodeBlockRequest)
	@IsOptional()
	codeBlock?: CreateCodeBlockRequest;
}
