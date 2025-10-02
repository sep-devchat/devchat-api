import { ApiError } from "@errors";

export class ThreadNotExistedError extends ApiError {
	constructor() {
		super({
			code: "thread_not_existed_err",
			message: "Thread does not exist",
			detail: null,
			status: 404,
		});
	}
}
