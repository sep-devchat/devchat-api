import { IsString } from "class-validator";

export class EditMessageRequest {
	@IsString()
	messageId: string;

	@IsString()
	content: string;
}
