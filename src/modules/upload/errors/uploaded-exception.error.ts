import { ApiError } from "@errors";

export class UploadedException extends ApiError {
	constructor(detail?: any) {
		super({
			code: "uploaded_exception_err",
			message: "File uploaded exception",
			detail: detail ?? null,
			status: 500,
		});
	}
}
