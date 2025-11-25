import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class ProgrammingLanguageQuery {
	@ApiProperty({ required: false, description: "Filter by language code" })
	@IsOptional()
	@IsString()
	code?: string;

	@ApiProperty({
		required: false,
		description: "Filter by language name (partial match)",
	})
	@IsOptional()
	@IsString()
	name?: string;

	@ApiProperty({ required: false, description: "Filter by version" })
	@IsOptional()
	@IsString()
	version?: string;

	@ApiProperty({
		required: false,
		description: "Free text search across code & name",
	})
	@IsOptional()
	@IsString()
	search?: string;

	@ApiProperty({ required: false, description: "Page number", default: 1 })
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@IsOptional()
	page: number = 1;

	@ApiProperty({ required: false, description: "Page size", default: 20 })
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@IsOptional()
	take: number = 20;
}
