import { ApiError } from "@errors";

export class NotGroupOwnerError extends ApiError {
	constructor() {
		super({
			code: "not_group_owner",
			message: "Only group owner can perform this action",
			detail: null,
		});
	}
}
