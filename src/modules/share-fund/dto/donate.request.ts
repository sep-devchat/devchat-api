import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class DonateShareFundRequest {
	@ApiProperty({ description: "Amount in VND" })
	@IsInt()
	@Min(1)
	amount: number;

	@ApiPropertyOptional({ description: "Optional message" })
	@IsOptional()
	@IsString()
	message?: string | null;
}
