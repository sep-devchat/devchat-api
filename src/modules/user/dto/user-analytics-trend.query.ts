import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UserAnalyticsTrendQuery {
	@ApiProperty({ enum: ["daily", "monthly"], default: "daily" })
	@IsIn(["daily", "monthly"])
	granularity: "daily" | "monthly";

	@ApiProperty({
		description: "Range start. YYYY-MM-DD for daily and YYYY-MM for monthly",
	})
	@IsString()
	@IsNotEmpty()
	start: string;

	@ApiProperty({
		description: "Range end. YYYY-MM-DD for daily and YYYY-MM for monthly",
	})
	@IsString()
	@IsNotEmpty()
	end: string;

	@ApiPropertyOptional({ description: "IANA timezone name", example: "UTC" })
	@IsOptional()
	@IsString()
	timezone?: string;
}
