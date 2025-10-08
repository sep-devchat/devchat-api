import { PartialType } from "@nestjs/swagger";
import { CreatePermissionRequest } from "./create.request";

export class UpdatePermissionRequest extends PartialType(
	CreatePermissionRequest,
) {}
