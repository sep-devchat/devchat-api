import { ApiError } from "@errors";

export class PermissionNotFoundError extends ApiError {
	constructor(detail?: any) {
		super({
			code: "PERMISSION_NOT_FOUND",
			message: "Permission not found",
			detail,
			status: 404,
		} as ApiError);
	}
}
