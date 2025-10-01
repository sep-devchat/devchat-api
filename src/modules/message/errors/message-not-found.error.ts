import { ApiError } from "@errors";

export class MessageNotFoundError extends ApiError {
	constructor() {
		super({
			code: "message_not_found",
			message: "The specified message was not found.",
			detail: null,
			status: 404,
		});
	}
}
