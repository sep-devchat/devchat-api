import { ApiError } from "@errors";

export class GroupInvitationNotFoundError extends ApiError {
	constructor() {
		super({
			code: "group_invitation_not_found_err",
			message: "Group invitation not found",
			detail: null,
			status: 404,
		});
	}
}
