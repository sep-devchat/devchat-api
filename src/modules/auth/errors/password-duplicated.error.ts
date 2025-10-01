import { ApiError } from "@errors";

export class PasswordDuplicatedError extends ApiError {
	constructor() {
		super({
			code: "password_duplicated_err",
			message: "New password must be different from the old one",
			detail: null,
			status: 400,
		});
	}
}
