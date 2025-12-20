import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	Length,
	Min,
} from "class-validator";

export class CreateShareFundRequest {
	@ApiProperty({ description: "Subscription id to base this share fund on" })
	@IsString()
	@IsNotEmpty()
	subscriptionId: string;

	@ApiPropertyOptional({ description: "Optional name for the share fund" })
	@IsOptional()
	@IsString()
	@Length(1, 150)
	fundName?: string | null;

	@ApiPropertyOptional({
		description: "Number of months this share fund is intended to purchase",
		example: 1,
		default: 1,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	monthQuantity?: number;

	@ApiPropertyOptional({
		description:
			"Max donation times allowed for this fund. Omit for unlimited.",
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	contributeTime?: number | null;
}
