import { ApiError } from "@errors";

export class AlreadyFriendError extends ApiError {
	constructor() {
		super({
			code: "already_friend_error",
			message: "Already friend before",
			detail: null,
		});
	}
}
