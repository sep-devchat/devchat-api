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
import { SocketConstants } from "./socket.constants";
import { Server, Socket } from "socket.io";
import {
	UseFilters,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import { SocketExceptionFilter } from "./socket.exception-filter";
import { AuthenticateRequest } from "./dto";
import { SocketGuard } from "./socket.guard";
import { SkipAuth } from "@utils";
import { CreateMessageRequest } from "@modules/message/dto";

const { Events } = SocketConstants;

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
			client.emit(Events.MESSAGE, {
				message: "Authentication timeout. Disconnecting...",
			});
			client.disconnect();
		}, 30000);
	}

	handleDisconnect(client: Socket) {
		console.log("Client disconnected:", client.id);
	}

	@SubscribeMessage(Events.AUTHENTICATE)
	@SkipAuth()
	async handleAuthenticate(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: AuthenticateRequest,
	) {
		await this.socketService.authenticateSocket(client, payload);
	}

	@SubscribeMessage(Events.MESSAGE)
	async handleMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: CreateMessageRequest,
	) {
		console.log("Message received from client:", client.id, payload);
		return await this.socketService.sendMessage(client, payload);
	}
}
