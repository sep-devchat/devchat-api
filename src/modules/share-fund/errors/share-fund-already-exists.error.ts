import { ApiError } from "@errors";

export class ShareFundAlreadyExistsError extends ApiError {
	constructor() {
		super({
			code: "share_fund_already_exists",
			message: "Share fund already exists for this subscription in the group",
			detail: null,
		});
	}
}
