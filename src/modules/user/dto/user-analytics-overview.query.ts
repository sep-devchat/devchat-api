import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UserAnalyticsOverviewQuery {
	@ApiPropertyOptional({
		description: "IANA timezone name",
		example: "America/Los_Angeles",
	})
	@IsOptional()
	@IsString()
	timezone?: string;
}
