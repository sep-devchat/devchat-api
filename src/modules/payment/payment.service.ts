import { Injectable } from "@nestjs/common";
import { CreatePaymentRequest } from "./dto";
import { Env } from "@utils";
import { VnpayService } from "nestjs-vnpay";
import {
	dateFormat,
	VnpLocale,
	VnpCurrCode,
	ReturnQueryFromVNPay,
} from "vnpay";

@Injectable()
export class PaymentService {
	constructor(private readonly vnpay: VnpayService) {}

	async createOne(dto: CreatePaymentRequest) {
		return this.createDepositUrl(dto);
	}

	async createDepositUrl(dto: CreatePaymentRequest) {
		const paymentUrl = this.vnpay.buildPaymentUrl({
			vnp_Amount: Math.round(dto.amount) * 100,
			vnp_TxnRef: `${Date.now()}`,
			vnp_OrderInfo: dto.userId,
			vnp_IpAddr: dto.ipAddr ?? "127.0.0.1",
			vnp_ReturnUrl: Env.VNP_RETURN_URL,
			vnp_CreateDate: Number(dateFormat(new Date())),
			vnp_Locale: VnpLocale.VN,
			vnp_CurrCode: VnpCurrCode.VND,
		});

		return { paymentUrl };
	}

	async handleCallback(query: ReturnQueryFromVNPay) {
		const verified = await this.vnpay.verifyReturnUrl(query);

		return {
			isSuccess: verified.isSuccess,
			isVerified: verified.isVerified,
			message: verified.message,
			amount: verified.vnp_Amount,
			orderInfo: verified.vnp_OrderInfo,
			txnRef: verified.vnp_TxnRef,
			bankCode: verified.vnp_BankCode,
			payDate: verified.vnp_PayDate,
			transactionNo: verified.vnp_TransactionNo,
			responseCode: verified.vnp_ResponseCode,
		};
	}
}
