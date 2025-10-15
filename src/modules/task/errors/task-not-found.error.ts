import { ApiError } from "@errors";

export class TaskNotFound extends ApiError {
	constructor() {
		super({
			code: "task_not_found",
			message: "Task not found",
			detail: null,
			status: 404,
		});
	}
}
