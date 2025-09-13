import { ApiError } from "@errors";

export class InvalidPkceAuthCodeError extends ApiError {
	constructor() {
		super({
			code: "invalid_pkce_auth_code_err",
			message: "The PKCE auth code is invalid or expired",
			status: 400,
			detail: null,
		});
	}
}
