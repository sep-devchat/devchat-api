import { ApiError } from "@errors";

export class CodeBlockNotFound extends ApiError {
	constructor() {
		super({
			code: "code_block_not_found",
			message: "Code block not found",
			detail: null,
			status: 404,
		});
	}
}
