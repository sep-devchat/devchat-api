import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class AttachmentQuery {
	@ApiProperty()
	@IsNumber()
	@Min(1)
	@Type(() => Number)
	page: number;

	@ApiProperty()
	@IsNumber()
	@Min(10)
	@Max(100)
	@Type(() => Number)
	size: number;

	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	threadId?: string;
}
