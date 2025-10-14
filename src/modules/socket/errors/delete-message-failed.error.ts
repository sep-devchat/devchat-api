import { WsException } from "@nestjs/websockets";

export class DeleteMessageFailedError extends WsException {
	constructor(reason: string) {
		super({
			code: "delete_message_failed_err",
			message: reason,
		});
	}
}
