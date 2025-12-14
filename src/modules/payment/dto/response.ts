import { ApiProperty } from "@nestjs/swagger";

export class PaymentResponse {
	@ApiProperty({
		example: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
	})
	paymentUrl: string;
}
