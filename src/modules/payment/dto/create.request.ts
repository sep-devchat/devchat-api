import { ApiProperty } from "@nestjs/swagger";
import {
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from "class-validator";

const SUPPORTED_LOCALES = ["vn", "en"] as const;

export class CreatePaymentRequest {
	@ApiProperty({ example: 150000, description: "Amount in VND" })
	@IsNumber()
	@Min(1)
	amount: number;

	@ApiProperty({ required: false, example: "127.0.0.1" })
	@IsString()
	@IsOptional()
	ipAddr?: string;

	@ApiProperty({
		example: "Payment for subscription",
		description: "Order information",
	})
	@IsString()
	userId: string;
}
