import { ApiError } from "@errors";
import { ArgumentsHost, Catch, HttpException } from "@nestjs/common";
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";

@Catch()
export class SocketExceptionFilter extends BaseWsExceptionFilter {
	catch(exception: any, host: ArgumentsHost) {
		if (!(exception instanceof WsException)) {
			if (exception instanceof ApiError) {
				super.catch(
					new WsException({ code: exception.code, message: exception.message }),
					host,
				);
			} else if (exception instanceof HttpException) {
				super.catch(
					new WsException({
						code: exception.getStatus().toString(),
						message: exception.message,
					}),
					host,
				);
			} else {
				console.log(
					"SocketExceptionFilter caught an unknown exception:",
					exception,
				);
				super.catch(
					new WsException({
						code: "unknown_err",
						message: exception.message || "Unknown error",
					}),
					host,
				);
			}
		} else {
			super.catch(exception, host);
		}
	}
}
