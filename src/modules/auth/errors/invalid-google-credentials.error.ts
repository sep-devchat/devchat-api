import { ApiError } from "@errors";

export class InvalidGoogleCredentialsError extends ApiError {
	constructor() {
		super({
			code: "invalid_google_credentials_err",
			message: "Invalid Google credentials",
			detail: null,
			status: 401,
		});
	}
}
