import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";

export class MessageQuery {
	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	threadId?: string;

	// @ApiProperty({ required: false })
	// @IsNumber()
	// @IsOptional()
	// @Type(() => Number)
	// timestamp?: number;
}
