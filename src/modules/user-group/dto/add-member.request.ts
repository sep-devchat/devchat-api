import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsUUID, IsOptional, IsString } from "class-validator";

export class AddMemberRequest {
	@ApiProperty({
		example: "ccc2c770-9fa6-11f0-b97a-4d13d9b105b0",
		description: "User ID to add as a member",
	})
	@IsUUID()
	userId: string;

	@ApiPropertyOptional({
		example: "MEMBER",
		description: "Role to assign to the member (ADMIN, MODERATOR, MEMBER)",
		enum: ["ADMIN", "MODERATOR", "MEMBER"],
		default: "MEMBER",
	})
	@IsOptional()
	@IsString()
	role?: string = "MEMBER";

	@ApiPropertyOptional({
		example: "Added directly by admin",
		description: "Optional note about why the member was added",
	})
	@IsOptional()
	@IsString()
	note?: string;
}
