import { ApiError } from "@errors";

export class AlreadyFriendsError extends ApiError {
	constructor() {
		super({
			code: "already_friends_err",
			message: "Users are already friends",
			detail: null,
			status: 400,
		});
	}
}
