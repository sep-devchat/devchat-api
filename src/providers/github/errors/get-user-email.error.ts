import { ApiError } from "@errors";

export class GetUserEmailsError extends ApiError {
	constructor() {
		super({
			code: "github_get_user_emails_err",
			message: "Failed to get user emails from GitHub",
			detail:
				"An error occurred while trying to get the user emails from GitHub. Please try again.",
			status: 500,
		});
	}
}
