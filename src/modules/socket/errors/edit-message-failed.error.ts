import { WsException } from "@nestjs/websockets";

export class EditMessageFailedError extends WsException {
	constructor(reason: string) {
		super({
			code: "edit_message_failed_err",
			message: reason,
		});
	}
}
