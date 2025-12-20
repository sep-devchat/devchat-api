import { Module } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PaymentController } from "./payment.controller";
import { VnpayModule } from "nestjs-vnpay";
import { Env } from "@utils";
import { consoleLogger, VnpCurrCode, VnpLocale } from "vnpay";
import { ConfigModule, ConfigService } from "@nestjs/config";
@Module({
	imports: [
		ConfigModule,
		VnpayModule.registerAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				secureSecret: configService.get<string>("VNP_HASH_SECRET"),
				tmnCode: configService.get<string>("VNP_TMNCODE"),
				vnpayHost: "https://sandbox.vnpayment.vn",
				testMode: true,
				loggerFn: consoleLogger,
			}),
			inject: [ConfigService],
		}),
	],
	providers: [PaymentService],
	exports: [PaymentService],
	controllers: [PaymentController],
})
export class PaymentModule {}
