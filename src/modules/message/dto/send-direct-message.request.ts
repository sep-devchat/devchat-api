import { IsUUID } from "class-validator";
import { SendMessageRequest } from "./send-message.request";

export class SendDirectMessageRequest extends SendMessageRequest {
	@IsUUID()
	toUserId: string;
}
