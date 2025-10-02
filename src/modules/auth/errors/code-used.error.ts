import { ApiError } from "@errors";

export class CodeUsedError extends ApiError {
	constructor() {
		super({
			code: "code_used_err",
			message: "This code has already been used",
			detail: null,
			status: 400,
		});
	}
}
