import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class ReportQuery {
	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	messageId?: string;

	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	createdById?: string;

	@ApiProperty()
	@IsNumber()
	@Type(() => Number)
	page: number;

	@ApiProperty()
	@IsNumber()
	@Type(() => Number)
	limit: number;

	@ApiProperty({ required: false, isArray: true })
	@IsString({ each: true })
	@IsOptional()
	@Transform(({ value }) => (Array.isArray(value) ? value : [value]))
	reportCategoryIds?: string[];
}
