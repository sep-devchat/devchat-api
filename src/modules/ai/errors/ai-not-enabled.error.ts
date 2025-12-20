import { ApiError } from "@errors";

export class AiNotEnabledForGroupError extends ApiError<{
	reason: "missing_subscription" | "ai_disabled" | "missing_group_context";
}> {
	constructor(
		reason: "missing_subscription" | "ai_disabled" | "missing_group_context",
	) {
		super({
			code: "ai_not_enabled_for_group",
			message:
				reason === "missing_subscription"
					? "AI is not available because this group has no active subscription."
					: reason === "ai_disabled"
						? "AI is not available for the current group subscription."
						: "AI is not available because group context is missing.",
			detail: { reason },
			status: 403,
		});
	}
}
