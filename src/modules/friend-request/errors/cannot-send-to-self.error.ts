import { ApiError } from "@errors";

export class CannotSendToSelfError extends ApiError {
	constructor() {
		super({
			code: "cannot_send_to_self_err",
			message: "Cannot send friend request to yourself",
			detail: null,
			status: 400,
		});
	}
}
