import { ApiProperty } from "@nestjs/swagger";
import {
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
} from "class-validator";

export class CreatePermissionRequest {
	@ApiProperty({ description: "Unique code (e.g. user.read)" })
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	@Matches(/^[a-zA-Z0-9_.:-]+$/)
	code: string;

	@ApiProperty({ description: "Readable permission name" })
	@IsString()
	@IsNotEmpty()
	@MaxLength(200)
	name: string;

	@ApiProperty({ description: "Optional description", required: false })
	@IsOptional()
	@IsString()
	description?: string;
}
