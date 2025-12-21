import { ApiError } from "@errors";

export class AccountInactiveError extends ApiError {
	constructor(reason: string) {
		super({
			code: "account_inactive_err",
			message: `The account is inactive. Reason: ${reason}. Please contact support: devchat.online@gmail.com`,
			status: 401,
			detail: null,
		});
	}
}
