import { ApiError } from "@errors";

export class FriendshipNotFoundError extends ApiError {
	constructor() {
		super({
			code: "friendship_not_found_err",
			message: "Friendship not found or you are not friends with this user",
			detail: null,
			status: 404,
		});
	}
}
