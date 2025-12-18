import { ApiError } from "@errors";

export class SubscriptionNotFoundError extends ApiError {
	constructor() {
		super({
			code: "subscription_not_found",
			message: "Subscription not found",
			detail: null,
		});
	}
}
