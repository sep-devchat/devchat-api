import { WsException } from "@nestjs/websockets";

export class JoinRoomFailedError extends WsException {
	constructor(message: string) {
		super({
			code: "join_room_failed_err",
			message,
		});
	}
}
