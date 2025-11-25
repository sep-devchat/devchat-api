import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UserLoginStatsQuery {
	@ApiPropertyOptional({
		description: "IANA timezone name",
		example: "Asia/Ho_Chi_Minh",
	})
	@IsOptional()
	@IsString()
	timezone?: string;
}
