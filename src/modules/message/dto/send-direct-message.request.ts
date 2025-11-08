import { IsUUID, IsString, IsOptional } from "class-validator";

export class SendDirectMessageRequest {
	@IsUUID()
	toUserId: string;

	@IsString()
	content: string;

	@IsUUID()
	@IsOptional()
	parentMessageId?: string;
}
