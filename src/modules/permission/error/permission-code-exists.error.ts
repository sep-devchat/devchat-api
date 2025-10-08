import { ApiError } from "@errors";

export class PermissionCodeExistsError extends ApiError {
	constructor(detail?: any) {
		super({
			code: "PERMISSION_CODE_ALREADY_EXISTS",
			message: "Permission code already exists",
			detail,
			status: 409,
		} as ApiError);
	}
}
