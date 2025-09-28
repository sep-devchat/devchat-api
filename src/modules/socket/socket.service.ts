import { AuthService } from "@modules/auth";
import { InvalidTokenError } from "@modules/auth/errors";
import { UserService } from "@modules/user";
import { Injectable } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { AuthenticateRequest } from "./dto";
import { SocketConstants } from "./socket.constants";
import { MessageService } from "@modules/message";
import { CreateMessageRequest, MessageResponse } from "@modules/message/dto";

const { Events } = SocketConstants;

@Injectable()
export class SocketService {
	server: Server;
	constructor(
		private readonly authService: AuthService,
		private readonly userService: UserService,
		private readonly messageService: MessageService,
	) {}

	async authenticateSocket(client: Socket, payload: AuthenticateRequest) {
		try {
			console.log(`Client ${client.id} is trying to authenticate`);
			const token = payload.token;
			if (!token) throw new InvalidTokenError();
			const decoded = this.authService.verifyAccessToken(token);
			const user = await this.userService.findById(decoded.sub);
			client.data.user = user;
			client.data.exp = decoded.exp;
			console.log(
				"Client authenticated:",
				client.id,
				"User:",
				user.username,
				"Exp:",
				new Date(decoded.exp * 1000).toISOString(),
			);
			// Notify client of successful authentication
			client.emit(Events.SOCKET_READY);
		} catch (err) {
			if (!err.message)
				console.error("Error during socket authentication:", err);
			client.emit(Events.AUTHENTICATE_FAILED, {
				message: "Authentication failed",
				detail: err.message ?? "Unknown error",
			});
			client.disconnect();
		}

		// Clear the timeout set for authentication
		clearTimeout(client.data.timeout);
	}

	async test(client: Socket) {
		console.log("SocketService test method called");
		return { message: "Test successful" };
	}

	async sendMessage(client: Socket, payload: CreateMessageRequest) {
		// Persist message with the current authenticated user as sender
		const insert = await this.messageService.createOne(
			payload,
			client.data.user.id,
		);

		const id = insert?.identifiers?.[0]?.id as string;
		const entity = await this.messageService.findOne(id);
		const resp = MessageResponse.fromEntity(entity);

		// Broadcast the new message to all connected clients
		// In the future, consider broadcasting to a room: this.server.to(payload.channelId).emit(...)
		this.server.emit(Events.MESSAGE, resp);

		// Acknowledge back to the sender
		return resp;
	}
}
