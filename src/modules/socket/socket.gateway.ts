import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WsException,
} from "@nestjs/websockets";
import { SocketService } from "./socket.service";
import { SocketEvents } from "./socket.constants";
import { Server, Socket } from "socket.io";
import {
	UseFilters,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import { SocketExceptionFilter } from "./socket.exception-filter";
import { AuthenticateRequest, ChatViewRequest, JoinRoomRequest } from "./dto";
import { SocketGuard } from "./socket.guard";
import { SkipAuth } from "@utils";

@WebSocketGateway({
	cors: {
		origin: "*",
	},
})
@UseGuards(SocketGuard)
@UseFilters(SocketExceptionFilter)
@UsePipes(
	new ValidationPipe({ exceptionFactory: (errors) => new WsException(errors) }),
)
export class SocketGateway
	implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
	constructor(private readonly socketService: SocketService) {}

	afterInit(server: Server) {
		console.log("WebSocket server initialized");
		this.socketService.server = server;
	}

	handleConnection(client: Socket) {
		console.log("New client connection:", client.id);
		// Timeout when user doesn't authenticate in 30 seconds
		client.data.timeout = setTimeout(() => {
			client.emit(SocketEvents.MESSAGE, {
				message: "Authentication timeout. Disconnecting...",
			});
			client.disconnect();
		}, 30000);
	}

	handleDisconnect(client: Socket) {
		console.log("Client disconnected:", client.id);
		this.socketService.clearPresenceForSocket(client);
	}

	@SubscribeMessage(SocketEvents.AUTHENTICATE)
	@SkipAuth()
	async handleAuthenticate(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: AuthenticateRequest,
	) {
		await this.socketService.authenticateSocket(client, payload);
	}

	@SubscribeMessage(SocketEvents.JOIN_ROOM)
	async handleJoinRoom(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: JoinRoomRequest,
	) {
		console.log("Join room request from client:", client.id, payload);
		return await this.socketService.joinRoom(client, payload);
	}

	@SubscribeMessage(SocketEvents.CHAT_VIEW)
	async handleChatView(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: ChatViewRequest,
	) {
		return await this.socketService.updateChatView(client, payload);
	}
}
