import { ApiError } from "@errors";

export class ShareFundNotFoundError extends ApiError {
	constructor() {
		super({
			code: "share_fund_not_found",
			message: "Share fund not found",
			detail: null,
		});
	}
}
