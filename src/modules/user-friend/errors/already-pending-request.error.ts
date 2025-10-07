import { ApiError } from "@errors";

export class AlreadyPendingRequestError extends ApiError {
	constructor() {
		super({
			code: "already_pending_request_error",
			message: "Already had pending request before",
			detail: null,
		});
	}
}
