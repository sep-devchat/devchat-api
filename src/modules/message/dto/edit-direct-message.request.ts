import { IsString } from "class-validator";

export class EditDirectMessageRequest {
	@IsString()
	messageId: string;

	@IsString()
	content: string;
}
