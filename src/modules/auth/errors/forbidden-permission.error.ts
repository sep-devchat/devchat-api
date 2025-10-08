import { ApiError } from "@errors";

interface ForbiddenPermissionDetail {
	missing: string[];
	required?: string[];
}

export class ForbiddenPermissionError extends ApiError<ForbiddenPermissionDetail> {
	constructor(missing: string[], required?: string[]) {
		super({
			code: "forbidden_permission_err",
			message: `Missing permissions: ${missing.join(", ")}`,
			detail: { missing, required },
			status: 403,
		} as ApiError<ForbiddenPermissionDetail>);
	}
}
