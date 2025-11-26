import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class ReportAnalyticsRangeQuery {
	@ApiPropertyOptional({
		description:
			"Range start (inclusive). Format: YYYY-MM-DD in viewer's timezone.",
		example: "2024-01-01",
	})
	@IsOptional()
	@IsString()
	start?: string;

	@ApiPropertyOptional({
		description:
			"Range end (inclusive). Format: YYYY-MM-DD in viewer's timezone.",
		example: "2024-01-31",
	})
	@IsOptional()
	@IsString()
	end?: string;

	@ApiPropertyOptional({
		description: "IANA timezone identifier used to interpret provided dates",
		example: "America/New_York",
	})
	@IsOptional()
	@IsString()
	timezone?: string;
}

export class ReportAnalyticsSummaryQuery extends ReportAnalyticsRangeQuery {
	@ApiPropertyOptional({
		description:
			"Rolling window (in days) for the recent report count when no custom range is provided",
		minimum: 1,
		maximum: 30,
		default: 7,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(30)
	recentDays?: number;
}

export class ReportAnalyticsTrendQuery extends ReportAnalyticsRangeQuery {
	@ApiPropertyOptional({
		description: "Granularity for the buckets when a custom range is provided",
		default: "daily",
		enum: ["daily", "monthly"],
	})
	@IsOptional()
	@IsIn(["daily", "monthly"])
	granularity?: "daily" | "monthly";

	@ApiPropertyOptional({
		description:
			"Number of days to include in the trend response when no custom range is provided",
		minimum: 3,
		maximum: 90,
		default: 14,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(3)
	@Max(90)
	trendDays?: number;
}

export class ReportAnalyticsCategoryQuery extends ReportAnalyticsRangeQuery {
	@ApiPropertyOptional({
		description: "Maximum number of categories to return",
		minimum: 1,
		maximum: 50,
		default: 10,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(50)
	limit?: number;
}

export class ReportAnalyticsReporterQuery extends ReportAnalyticsRangeQuery {
	@ApiPropertyOptional({
		description: "Maximum number of reporters to return",
		minimum: 1,
		maximum: 50,
		default: 5,
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(50)
	limit?: number;
}
