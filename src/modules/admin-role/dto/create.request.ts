import { ApiProperty } from "@nestjs/swagger";
import {
	IsArray,
	IsBoolean,
	IsNotEmpty,
	IsOptional,
	IsString,
	MaxLength,
} from "class-validator";

export class CreateAdminRoleRequest {
	@ApiProperty()
	role: string;

	@ApiProperty({ description: "Display name for the role" })
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	roleName: string;

	@ApiProperty({
		type: [String],
		description: "List of permission identifiers",
	})
	@IsArray()
	@IsString({ each: true })
	permissions: string[];

	@ApiProperty({ required: false, default: true })
	@IsOptional()
	@IsBoolean()
	isActive?: boolean = true;
}
