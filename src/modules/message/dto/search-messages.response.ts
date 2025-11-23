import { MessageEntity, ThreadMessageEntity } from "@db/entities";
import { MessageResponse } from "./message.response";
import { ThreadMessageResponse } from "./thread-message.response";
import { ApiProperty } from "@nestjs/swagger";

export type SearchMessageKind = "message" | "thread_message";

export class SearchMessageResult {
	@ApiProperty({
		enum: ["message", "thread_message"],
		description: "Result type",
	})
	type: SearchMessageKind;

	@ApiProperty({
		description: "Standard channel message result",
		required: false,
		type: () => MessageResponse,
	})
	message?: MessageResponse;

	@ApiProperty({
		description: "Thread message result",
		required: false,
		type: () => ThreadMessageResponse,
	})
	threadMessage?: ThreadMessageResponse;

	@ApiProperty({
		description: "Creation timestamp",
		example: new Date().toISOString(),
	})
	createdAt: Date;

	static fromMessage(entity: MessageEntity): SearchMessageResult {
		return {
			type: "message",
			message: MessageResponse.fromEntity(entity),
			createdAt: entity.createdAt,
		};
	}

	static fromThreadMessage(entity: ThreadMessageEntity): SearchMessageResult {
		return {
			type: "thread_message",
			threadMessage: ThreadMessageResponse.fromEntity(entity),
			createdAt: entity.createdAt,
		};
	}
}
