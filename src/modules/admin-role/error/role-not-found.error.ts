import { ApiError } from "@errors";

export class RoleNotFoundError extends ApiError {
	constructor(detail?: any) {
		super({
			code: "ADMIN_ROLE_NOT_FOUND",
			message: "Role not found",
			detail,
			status: 404,
		} as ApiError);
	}
}
