import { ApiError } from "@errors";

export class ThreadExistedError extends ApiError {
	constructor() {
		super({
			code: "thread_existed_err",
			message: "Thread already exists",
			detail: null,
			status: 400,
		});
	}
}
