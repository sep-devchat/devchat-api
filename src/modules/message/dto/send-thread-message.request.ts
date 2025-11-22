import { IsString } from "class-validator";
import { SendMessageRequest } from "./send-message.request";

export class SendThreadMessageRequest extends SendMessageRequest {
	@IsString()
	threadId: string;
}
