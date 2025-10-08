import { ApiError } from "@errors";

export class MemberExistedError extends ApiError {
	constructor() {
		super({
			code: "member_existed_error",
			message: "Member already exist",
			detail: null,
		});
	}
}
