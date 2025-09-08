import { ApiError } from "@errors";

export class RefreshTokenError extends ApiError {
	constructor() {
		super({
			code: "refresh_token_err",
			message: "Invalid or expired refresh token",
			detail: null,
			status: 401,
		});
	}
}
