import { ApiError } from "@errors";

export class InvalidInvitationError extends ApiError {
	constructor() {
		super({
			code: "invalid_invitation_error",
			message: "Invalid invitation",
			detail: null,
		});
	}
}
