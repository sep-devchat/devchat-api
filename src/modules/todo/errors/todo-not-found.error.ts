import { ApiError } from "@errors";

export class TodoNotFound extends ApiError {
	constructor() {
		super({
			code: "todo_not_found",
			message: "Todo item not found",
			detail: null,
			status: 404,
		});
	}
}
