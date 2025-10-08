import { ApiError } from "@errors";

export class RoleAlreadyExistsError extends ApiError {
	constructor(detail?: any) {
		super({
			code: "ADMIN_ROLE_ALREADY_EXISTS",
			message: "Role enum already exists",
			detail,
			status: 409,
		} as ApiError);
	}
}
