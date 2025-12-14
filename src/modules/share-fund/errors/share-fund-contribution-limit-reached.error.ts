import { ApiError } from "@errors";

export class ShareFundContributionLimitReachedError extends ApiError {
	constructor() {
		super({
			code: "share_fund_contribution_limit_reached",
			message: "Share fund contribution limit reached",
			detail: null,
		});
	}
}
