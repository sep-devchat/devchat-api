import { ApiError } from "@errors";

export class MemberNotFoundError extends ApiError {
	constructor() {
		super({
			code: "member_not_fount_error",
			message: "Member not found",
			detail: null,
			status: 404,
		});
	}
}
