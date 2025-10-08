import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsUUID, Max, Min } from "class-validator";

export class UserGroupQuery {
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
}
