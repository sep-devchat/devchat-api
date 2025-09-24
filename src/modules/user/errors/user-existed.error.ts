import { ApiError } from "@errors";

export class UserExistedError extends ApiError {
	constructor() {
		super({
			code: "user_existed_err",
			message: "User already exists",
			detail: null,
			status: 401,
		});
	}
}
