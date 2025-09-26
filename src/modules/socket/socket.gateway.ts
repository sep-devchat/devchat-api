import {
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
} from "@nestjs/websockets";
import { SocketService } from "./socket.service";
import { SocketConstants } from "./socket.constants";
import { Socket } from "socket.io";

const { Events } = SocketConstants;

@WebSocketGateway()
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
	constructor(private readonly socketService: SocketService) {}

	handleConnection(client: Socket, ...args: any[]) {
		console.log("Client connected:", client.id);
	}

	handleDisconnect(client: Socket) {
		console.log("Client disconnected:", client.id);
	}

	@SubscribeMessage(Events.MESSAGE)
	async handleMessage(client: Socket, payload: any) {
		console.log("Message received from client:", client.id, payload);
	}
}
