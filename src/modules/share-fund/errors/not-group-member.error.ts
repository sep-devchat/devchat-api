import { ApiError } from "@errors";

export class NotGroupMemberError extends ApiError {
	constructor() {
		super({
			code: "not_group_member",
			message: "Only group members can perform this action",
			detail: null,
		});
	}
}
