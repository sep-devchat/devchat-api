import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Min } from "class-validator";
import { Transform, Type } from "class-transformer";

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

	@ApiProperty({ required: false, description: "Filter by active status" })
	@Transform(({ value }) => {
		if (value === undefined || value === null || value === "") return undefined;
		if (typeof value === "boolean") return value;
		const normalized = String(value).toLowerCase();
		return normalized === "true" || normalized === "1";
	})
	@IsBoolean()
	@IsOptional()
	isActive?: boolean;

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
