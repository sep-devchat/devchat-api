import { ApiError } from "@errors";

export class FriendRequestAlreadyExistsError extends ApiError {
	constructor() {
		super({
			code: "friend_request_already_exists_err",
			message: "Friend request already exists",
			detail: null,
			status: 400,
		});
	}
}
