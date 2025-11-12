import { ApiError } from "@errors";

export class CannotInviteToSelfError extends ApiError {
	constructor() {
		super({
			code: "cannot_invite_to_self_err",
			message: "Cannot invite yourself to a group",
			detail: null,
			status: 400,
		});
	}
}
