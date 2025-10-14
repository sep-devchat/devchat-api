import { ApiError } from "@errors";

export class OpenAIKeyMissingError extends ApiError<{ envVar: string }> {
	constructor() {
		super({
			code: "openai_key_missing_error",
			message: "OPENAI_API_KEY is not configured on the server.",
			detail: null,
			status: 500,
		});
	}
}
