import { Module } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PaymentController } from "./payment.controller";
import { VnpayModule } from "nestjs-vnpay";
import { Env } from "@utils";
import { VnpCurrCode, VnpLocale } from "vnpay";
@Module({
	imports: [
		VnpayModule.register({
			tmnCode: Env.VNP_TMN_CODE,
			secureSecret: Env.VNP_HASH_SECRET,
			vnpayHost: Env.VNP_API_URL,
			vnp_Locale: VnpLocale.VN,
			vnp_CurrCode: VnpCurrCode.VND,
			testMode: true,
		}),
	],
	providers: [PaymentService],
	exports: [PaymentService],
	controllers: [PaymentController],
})
export class PaymentModule {}
