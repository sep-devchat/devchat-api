import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
	IsBoolean,
	IsOptional,
	IsDateString,
	IsUUID,
	IsNumber,
} from "class-validator";

export class NotificationQuery {
	@ApiProperty({ required: false })
	@IsBoolean()
	@IsOptional()
	@Type(() => Boolean)
	unread?: boolean;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsDateString()
	cursorCreatedAt?: string;

	@ApiProperty({
		required: false,
		description: "Limit number of items (default 20, max 100)",
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	limit?: number;
}
