import { ApiError } from "@errors";

export class UserNotFoundError extends ApiError {
	constructor(detail?: any) {
		super({
			code: "ADMIN_ROLE_USER_NOT_FOUND",
			message: "User not found",
			detail,
			status: 404,
		} as ApiError);
	}
}
