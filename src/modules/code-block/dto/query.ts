import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, Min, Max } from "class-validator";

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
