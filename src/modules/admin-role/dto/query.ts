import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class AdminRoleQuery {
	@ApiPropertyOptional()
	@IsOptional()
	role?: string;

	@ApiPropertyOptional({ description: "Text search in roleName" })
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
