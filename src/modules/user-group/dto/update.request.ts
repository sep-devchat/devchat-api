import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UpdateUserGroupRequest {
	@ApiPropertyOptional({
		example: { name: "admin", level: 2 },
		description: "Role object",
	})
	@IsOptional()
	role?: object;

	@ApiPropertyOptional({
		example: { read: true, write: true, delete: true },
		description: "Permission object",
	})
	@IsOptional()
	permission?: object;
}
