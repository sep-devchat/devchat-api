import { ApiError } from "@errors";

export class MessageNotFoundError extends ApiError<{ messageId: string }> {
	constructor(messageId: string) {
		super({
			code: "message_not_found_error",
			message: "Message not found for the provided messageId.",
			detail: { messageId },
			status: 404,
		});
	}
}
