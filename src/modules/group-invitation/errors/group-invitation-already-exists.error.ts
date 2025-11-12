import { ApiError } from "@errors";

export class GroupInvitationAlreadyExistsError extends ApiError {
	constructor() {
		super({
			code: "group_invitation_already_exists_err",
			message: "Group invitation already exists",
			detail: null,
			status: 400,
		});
	}
}
