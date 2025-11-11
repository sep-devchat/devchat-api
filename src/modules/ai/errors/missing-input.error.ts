import { ApiError } from "@errors";

export class MissingPromptOrMessageError extends ApiError<{
	required: Array<"prompt" | "messageId">;
}> {
	constructor() {
		super({
			code: "missing_prompt_or_message_error",
			message: "Either 'prompt' or 'messageId' must be provided to ask the AI.",
			detail: { required: ["prompt", "messageId"] },
		});
	}
}
