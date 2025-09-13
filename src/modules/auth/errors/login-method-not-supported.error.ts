import { ApiError } from "@errors";

export class LoginMethodNotSupportedError extends ApiError {
	constructor() {
		super({
			code: "login_method_not_supported_err",
			message: "The login method is not supported",
			status: 400,
			detail: null,
		});
	}
}
