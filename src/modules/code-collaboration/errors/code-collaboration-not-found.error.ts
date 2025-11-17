import { ApiError } from "@errors";

export class CodeCollaborationNotFoundError extends ApiError {
	constructor() {
		super({
			code: "code_collaboration_not_found_err",
			message: "The requested code collaboration was not found.",
			detail: null,
			status: 404,
		});
	}
}
