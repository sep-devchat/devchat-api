import { ApiError } from "@errors";

export class GetAccessTokenError extends ApiError {
	constructor() {
		super({
			code: "github_get_access_token_err",
			message: "Failed to get access token from GitHub",
			detail:
				"An error occurred while trying to get the access token from GitHub. Please try again.",
			status: 500,
		});
	}
}
