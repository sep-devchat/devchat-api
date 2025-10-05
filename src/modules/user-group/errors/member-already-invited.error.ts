import { ApiError } from "@errors";

export class MemberAlreadyInvitedError extends ApiError {
	constructor() {
		super({
			code: "member_already_invited_error",
			message: "Member already invited",
			detail: null,
		});
	}
}
