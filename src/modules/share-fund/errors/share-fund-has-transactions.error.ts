import { ApiError } from "@errors";

export class ShareFundHasTransactionsError extends ApiError {
	constructor() {
		super({
			code: "share_fund_has_transactions",
			message: "Cannot delete share fund because it already has contributions",
			detail: null,
		});
	}
}
