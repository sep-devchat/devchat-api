import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";

export class CreateUserGroupRequest {
	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Group ID",
	})
	@IsUUID()
	groupId: string;

	@ApiProperty({
		example: "ccc2c770-9fa6-11f0-b97a-4d13d9b105b0",
		description: "User ID",
	})
	@IsUUID()
	userId: string;

	// @ApiPropertyOptional({
	//     example: { name: "member", level: 1 },
	//     description: "Role object"
	// })
	// @IsOptional()
	// role?: object;

	// @ApiPropertyOptional({
	//     example: { read: true, write: false, delete: false },
	//     description: "Permission object"
	// })
	// @IsOptional()
	// permission?: object;
}
