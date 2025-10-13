import { OmitType } from "@nestjs/swagger";
import { CreateMessageRequest } from "./create.request";

export class UpdateMessageRequest extends OmitType(CreateMessageRequest, [
	"threadId",
	"parentMessageId",
]) {}
