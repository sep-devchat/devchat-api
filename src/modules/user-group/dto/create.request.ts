import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";

export class CreateInvitationRequest {
	@ApiProperty({
		example: "ccc2c770-9fa6-11f0-b97a-4d13d9b105b0",
		description: "User ID or Email of the member to be invited",
	})
	userIdOrEmail: string;

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
