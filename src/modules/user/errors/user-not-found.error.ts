import { ApiError } from "@errors";

export class UserNotFoundError extends ApiError {
	constructor() {
		super({
			code: "user_not_found_err",
			message: "User not found",
			detail: null,
			status: 404,
		});
	}
}
