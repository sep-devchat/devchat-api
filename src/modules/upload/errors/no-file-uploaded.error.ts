import { ApiError } from "@errors";

export class NoFileUploadedError extends ApiError {
	constructor() {
		super({
			code: "no_file_uploaded_err",
			message: "No file uploaded",
			detail: null,
			status: 400,
		});
	}
}
