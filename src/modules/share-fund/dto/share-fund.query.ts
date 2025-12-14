import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";

export class ShareFundQuery {
	@ApiPropertyOptional({ description: "Filter by group id" })
	@IsOptional()
	@IsUUID()
	groupId?: string;

	@ApiPropertyOptional({ description: "Filter by subscription id" })
	@IsOptional()
	@IsString()
	subscriptionId?: string;
}
