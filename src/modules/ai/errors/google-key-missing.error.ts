import { ApiError } from "@errors";

export class GoogleKeyMissingError extends ApiError<{ envVar: string[] }> {
	constructor() {
		super({
			code: "google_key_missing_error",
			message: "Google Generative AI API key is not configured on the server.",
			detail: null,
			status: 500,
		});
	}
}
