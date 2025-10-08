import { PartialType } from "@nestjs/swagger";
import { CreateAdminRoleRequest } from "./create.request";

export class UpdateAdminRoleRequest extends PartialType(
	CreateAdminRoleRequest,
) {}
