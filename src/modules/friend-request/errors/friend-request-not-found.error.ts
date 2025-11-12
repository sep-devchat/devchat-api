import { ApiError } from "@errors";

export class FriendRequestNotFoundError extends ApiError {
	constructor() {
		super({
			code: "friend_request_not_found_err",
			message: "Friend request not found",
			detail: null,
			status: 404,
		});
	}
}
