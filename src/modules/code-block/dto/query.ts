import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
	IsOptional,
	IsNumber,
	Min,
	Max,
	IsEnum,
	IsString,
} from "class-validator";
import { ProgrammingLanguageEnum } from "@modules/code/code.enums";

export class CodeBlockQuery {
	@ApiProperty({ required: true })
	@IsNumber()
	@Min(1)
	@Type(() => Number)
	page: number;

	@ApiProperty({ required: true })
	@IsNumber()
	@Min(10)
	@Max(100)
	@Type(() => Number)
	limit: number;
}
