import { ApiError } from "@errors";

export class CodeExpiredError extends ApiError {
	constructor() {
		super({
			code: "code_expired_err",
			message: "This code has expired",
			detail: null,
			status: 400,
		});
	}
}
