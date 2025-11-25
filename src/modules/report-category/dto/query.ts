import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class ReportCategoryQuery {
	@ApiPropertyOptional({ description: "Filter by name or description" })
	@IsOptional()
	@IsString()
	search?: string;
}

export class ReportCategoryAdminQuery extends ReportCategoryQuery {
	@ApiPropertyOptional({ description: "Current page", default: 1 })
	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	page: number;

	@ApiPropertyOptional({
		description: "Items per page",
		default: 20,
		maximum: 100,
	})
	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(1)
	@Max(100)
	take: number;
}
