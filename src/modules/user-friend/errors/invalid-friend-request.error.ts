import { ApiError } from "@errors";

export class InvalidFriendRequestStatusError extends ApiError {
	constructor() {
		super({
			code: "invalid_friend_request_status",
			message: "Invalid friend request status transition",
			detail: null,
		});
	}
}
