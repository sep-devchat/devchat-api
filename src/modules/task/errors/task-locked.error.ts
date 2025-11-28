import { ApiError } from "@errors";

export class TaskLocked extends ApiError {
	constructor() {
		super({
			code: "task_locked",
			message: "Tasks completed for more than 3 days cannot be modified",
			detail: null,
			status: 400,
		});
	}
}
