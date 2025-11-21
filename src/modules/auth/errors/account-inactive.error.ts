import { ApiError } from "@errors";

export class AccountInactiveError extends ApiError {
	constructor() {
		super({
			code: "account_inactive_err",
			message: "The account is inactive. Please contact support.",
			status: 401,
			detail: null,
		});
	}
}
