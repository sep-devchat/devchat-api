import { ApiError } from "@errors";

export class AssigneeIsNotGroupMember extends ApiError {
	constructor() {
		super({
			code: "assignee_not_group_member",
			message: "Assignee is not a group member",
			detail: null,
		});
	}
}
