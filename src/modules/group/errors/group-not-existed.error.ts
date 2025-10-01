import { ApiError } from "@errors";

export class GroupNotExistedError extends ApiError {
	constructor() {
		super({
			code: "group_not_existed_err",
			message: "Group does not exist",
			detail: null,
			status: 404,
		});
	}
}
