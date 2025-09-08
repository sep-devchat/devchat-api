import { ApiError } from "@errors";

export class GetUserInfoError extends ApiError {
	constructor() {
		super({
			code: "github_get_user_info_err",
			message: "Failed to get user info from GitHub",
			detail:
				"An error occurred while trying to get the user info from GitHub. Please try again.",
			status: 500,
		});
	}
}
