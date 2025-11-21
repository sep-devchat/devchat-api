import {
	ConnectedSocket,
	MessageBody,
	OnGatewayInit,
	SubscribeMessage,
	WebSocketGateway,
	WsException,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import {
	UseFilters,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from "@nestjs/common";
import { SocketExceptionFilter } from "@modules/socket/socket.exception-filter";
import { SocketGuard } from "@modules/socket/socket.guard";
import { SocketConstants } from "@modules/socket/socket.constants";
import { MessageService } from "./message.service";
import { SendMessageRequest } from "./dto/send-message.request";
import { FetchMessagesRequest } from "./dto/fetch-messages.request";
import { EditMessageRequest } from "./dto/edit-message.request";
import { FetchDirectMessagesRequest } from "./dto/fetch-direct-messages.request";
import { SendDirectMessageRequest } from "./dto/send-direct-message.request";
import { EditDirectMessageRequest } from "./dto/edit-direct-message.request";

const { Events } = SocketConstants;

@WebSocketGateway({
	cors: { origin: "*" },
})
@UseGuards(SocketGuard)
@UseFilters(SocketExceptionFilter)
@UsePipes(
	new ValidationPipe({ exceptionFactory: (errors) => new WsException(errors) }),
)
export class MessageGateway implements OnGatewayInit {
	constructor(private readonly messageService: MessageService) {}

	afterInit(server: Server) {
		// nothing persistent needed; server passed on per-call
	}

	@SubscribeMessage(Events.MESSAGE)
	async handleMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: SendMessageRequest,
	) {
		return await this.messageService.sendMessage(
			client,
			payload,
			client.nsp.server,
		);
	}

	@SubscribeMessage(Events.FETCH_MESSAGES)
	async handleFetchMessages(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: FetchMessagesRequest,
	) {
		return await this.messageService.fetchMessages(client, payload);
	}

	@SubscribeMessage(Events.EDIT_MESSAGE)
	async handleEditMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: EditMessageRequest,
	) {
		return await this.messageService.editMessage(
			client,
			payload,
			client.nsp.server,
		);
	}

	@SubscribeMessage(Events.DELETE_MESSAGE)
	async handleDeleteMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody() id: string,
	) {
		return await this.messageService.deleteMessage(
			client,
			id,
			client.nsp.server,
		);
	}

	@SubscribeMessage(Events.FETCH_DIRECT_MESSAGES)
	async handleFetchDirectMessages(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: FetchDirectMessagesRequest,
	) {
		return await this.messageService.fetchDirectMessages(client, payload);
	}

	@SubscribeMessage(Events.SEND_DIRECT_MESSAGE)
	async handleSendDirectMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: SendDirectMessageRequest,
	) {
		return await this.messageService.sendDirectMessage(
			client,
			payload,
			client.nsp.server,
		);
	}

	@SubscribeMessage(Events.EDIT_DIRECT_MESSAGE)
	async handleEditDirectMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody() payload: EditDirectMessageRequest,
	) {
		return await this.messageService.editDirectMessage(
			client,
			payload,
			client.nsp.server,
		);
	}

	@SubscribeMessage(Events.DELETE_DIRECT_MESSAGE)
	async handleDeleteDirectMessage(
		@ConnectedSocket() client: Socket,
		@MessageBody() id: string,
	) {
		return await this.messageService.deleteDirectMessage(
			client,
			id,
			client.nsp.server,
		);
	}
}
