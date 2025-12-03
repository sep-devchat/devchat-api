import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class ProgrammingLanguageQuery {
	@ApiProperty({ required: false, description: "Filter by active status" })
	@IsBoolean()
	@IsOptional()
	@Type(() => Boolean)
	isActive?: boolean;

	@ApiProperty({ required: false, description: "Filter by executable status" })
	@IsBoolean()
	@IsOptional()
	@Type(() => Boolean)
	isExecutable?: boolean;

	@ApiProperty()
	page: number;

	@ApiProperty()
	limit: number;
}
