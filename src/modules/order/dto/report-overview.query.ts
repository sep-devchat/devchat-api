import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsISO8601, IsOptional } from "class-validator";

export class OrderReportOverviewQuery {
	@ApiPropertyOptional({
		description: "Filter from this ISO datetime (inclusive)",
		example: "2025-01-01T00:00:00.000Z",
	})
	@IsOptional()
	@IsISO8601()
	from?: string;

	@ApiPropertyOptional({
		description: "Filter to this ISO datetime (inclusive)",
		example: "2025-12-31T23:59:59.999Z",
	})
	@IsOptional()
	@IsISO8601()
	to?: string;
}
