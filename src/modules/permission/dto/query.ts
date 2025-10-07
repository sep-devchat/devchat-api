import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsNumber, Min } from "class-validator";

export class PermissionQuery {
	@ApiPropertyOptional({ description: "Search in code or name" })
	@IsOptional()
	@IsString()
	search?: string;

	@ApiPropertyOptional({ default: 1 })
	@IsOptional()
	@IsNumber()
	@Min(1)
	page?: number = 1;

	@ApiPropertyOptional({ default: 20 })
	@IsOptional()
	@IsNumber()
	@Min(1)
	limit?: number = 20;
}
