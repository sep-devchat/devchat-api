import { ApiProperty } from "@nestjs/swagger";
import { MessageTypeEnum } from "@utils";
import { Transform, Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";

export class ReportQuery {
	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	messageId?: string;

	@ApiProperty({ required: false, enum: MessageTypeEnum })
	@IsEnum(MessageTypeEnum)
	@IsOptional()
	messageType?: MessageTypeEnum;

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
