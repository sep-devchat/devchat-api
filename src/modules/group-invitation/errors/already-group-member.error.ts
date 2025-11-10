import { ApiError } from "@errors";

export class AlreadyGroupMemberError extends ApiError {
	constructor() {
		super({
			code: "already_group_member_err",
			message: "User is already a member of this group",
			detail: null,
			status: 400,
		});
	}
}
