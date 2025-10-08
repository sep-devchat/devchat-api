import { ApiError } from "@errors";

export class InvitationNotFoundError extends ApiError {
	constructor() {
		super({
			code: "invitation_not_fount_error",
			message: "Invitation not found",
			detail: null,
			status: 404,
		});
	}
}
