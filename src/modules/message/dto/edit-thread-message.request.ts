import { IsString } from "class-validator";

export class EditThreadMessageRequest {
	@IsString()
	threadMessageId: string;

	@IsString()
	content: string;
}
