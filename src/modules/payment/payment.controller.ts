import { Controller, Body, Post, Get, Query } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { ReturnQueryFromVNPay } from "vnpay";
import { PaymentService } from "./payment.service";
import { CreatePaymentRequest, PaymentResponse } from "./dto";
import { ApiResponseDto } from "@utils";

@Controller("payment")
export class PaymentController {
	constructor(private readonly paymentService: PaymentService) {}

	@Post("deposit")
	@ApiOperation({
		summary: "Create VNPay deposit URL",
		description: "Builds a VNPay payment URL for the user to deposit funds",
	})
	async createDeposit(@Body() dto: CreatePaymentRequest) {
		const data = await this.paymentService.createDepositUrl(dto);
		return new ApiResponseDto<PaymentResponse>(
			data,
			null,
			"Created successfully",
		);
	}

	@Get("callback")
	@ApiOperation({
		summary: "Handle VNPay return URL",
		description: "Verifies VNPay callback and returns transaction info",
	})
	async handleCallback(@Query() query: ReturnQueryFromVNPay) {
		const data = await this.paymentService.handleCallback(query);
		return new ApiResponseDto(data, null, "Verified callback");
	}
}
