import { ApiError } from "@errors";

export class MissingVerifyTokenError extends ApiError {
	constructor() {
		super({
			code: "missing_verify_token_err",
			message: "Missing verify token",
			detail: null,
			status: 404,
		});
	}
}
