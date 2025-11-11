import { ApiError } from "@errors";

export class NoLLMConfiguredError extends ApiError<{ required: string[] }> {
	constructor() {
		super({
			code: "no_llm_configured_error",
			message:
				"No LLM provider is configured. Set one of the required API keys.",
			detail: null,
			status: 500,
		});
	}
}
