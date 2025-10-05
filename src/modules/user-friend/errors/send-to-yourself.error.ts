import { ApiError } from "@errors";

export class SendToYourSelfError extends ApiError {
	constructor() {
		super({
			code: "send_to_yourself_error",
			message: "Can not send friend request to yourself",
			detail: null,
		});
	}
}
