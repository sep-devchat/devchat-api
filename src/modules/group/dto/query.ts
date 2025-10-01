import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, Min, Max, IsString, IsOptional } from "class-validator";

export class GroupQuery {
	@ApiProperty({ required: true })
	@IsNumber()
	@Min(1)
	@Type(() => Number)
	page: number;

	@ApiProperty({ required: true })
	@IsNumber()
	@Min(1)
	@Max(100)
	@Type(() => Number)
	limit: number;

	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	@Type(() => String)
	name?: string;
}
