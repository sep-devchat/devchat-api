import { AuthService } from "@modules/auth";
import { InvalidTokenError } from "@modules/auth/errors";
import { UserService } from "@modules/user";
import { Injectable } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import {
	AuthenticateRequest,
	EditMessageRequest,
	JoinRoomRequest,
	MessageResponse,
	SendMessageRequest,
} from "./dto";
import { SocketConstants } from "./socket.constants";
import {
	ChannelRepository,
	GroupRepository,
	MessageRepository,
	UserRepository,
} from "@db/repositories";
import {
	DeleteMessageFailedError,
	EditMessageFailedError,
	JoinRoomFailedError,
} from "./errors";
import { MessageEntity } from "@db/entities";

const { Events } = SocketConstants;

@Injectable()
export class SocketService {
	server: Server;
	constructor(
		private readonly authService: AuthService,
		private readonly userService: UserService,
		private readonly groupRepo: GroupRepository,
		private readonly channelRepo: ChannelRepository,
		private readonly messageRepo: MessageRepository,
		private readonly userRepo: UserRepository,
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
			client.join(this.constructUserRoomName(user.id));
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

	// A function to construct room names
	constructRoomName(groupId: string, channelId: string) {
		return `group_${groupId}:channel_${channelId}`;
	}

	constructUserRoomName(userId: string) {
		return `user:${userId}`;
	}

	async joinRoom(client: Socket, payload: JoinRoomRequest) {
		const { groupId, channelId } = payload;

		// Validate group exists
		const group = await this.groupRepo.findOne({
			where: [
				{
					id: groupId,
					createdBy: client.data.user.id,
				},
				{
					id: groupId,
					userGroups: {
						userId: client.data.user.id,
					},
				},
			],
		});
		if (!group) throw new JoinRoomFailedError("Group not found");

		// Validate that the channel belongs to the provided group
		const channel = await this.channelRepo.findOne({
			where: { id: channelId, groupId: group.id },
		});
		if (!channel) throw new JoinRoomFailedError("Channel not found in group");

		// Check for existing room and leave if present
		if (client.data.room) {
			await client.leave(client.data.room);
		}

		const room = this.constructRoomName(groupId, channelId);
		await client.join(room);

		// Store for future usage
		client.data.group = group;
		client.data.channel = channel;
		client.data.room = room;

		client.emit(Events.JOINED_ROOM, {
			room,
			groupId,
			channelId,
		});
	}

	async fetchMessages(client: Socket) {
		const messages = await this.messageRepo.find({
			where: { channelId: client.data.channel.id },
			relations: { sender: true },
			order: { createdAt: "DESC" },
			take: 50,
		});

		return MessageResponse.fromEntities(messages);
	}

	async createMessageNotification(message: MessageEntity) {
		const listUsers = await this.userRepo.find({
			where: { userGroups: { groupId: message.channel.groupId } },
		});
		listUsers.forEach((user) =>
			this.server
				.to(this.constructUserRoomName(user.id))
				.emit(Events.MESSAGE_NOTIFICATION, MessageResponse.fromEntity(message)),
		);
	}

	async sendMessage(client: Socket, payload: SendMessageRequest) {
		const insertResult = await this.messageRepo.insert({
			channelId: client.data.channel.id,
			threadId: payload.threadId,
			parentMessageId: payload.parentMessageId,
			senderId: client.data.user.id,
			content: payload.content,
		});

		const message = await this.messageRepo.findOne({
			where: { id: insertResult.identifiers[0].id },
			relations: { sender: true, channel: { group: true } },
		});

		console.log(message);

		const resp = MessageResponse.fromEntity(message);

		this.server.to(client.data.room).emit(Events.MESSAGE, resp);
		this.createMessageNotification(message);
	}

	async editMessage(client: Socket, dto: EditMessageRequest) {
		const message = await this.messageRepo.findOne({
			where: { id: dto.messageId },
			relations: { sender: true, channel: { group: true } },
		});

		if (!message) throw new EditMessageFailedError("Message not found");

		if (message.senderId !== client.data.user.id)
			throw new EditMessageFailedError("You can only edit your own messages");

		message.content = dto.content;
		message.updatedAt = new Date();

		await this.messageRepo.save(message);

		this.server
			.to(client.data.room)
			.emit(Events.EDIT_MESSAGE, MessageResponse.fromEntity(message));
	}

	async deleteMessage(client: Socket, id: string) {
		const message = await this.messageRepo.findOne({
			where: { id: id },
			relations: { sender: true, channel: { group: true } },
		});

		if (!message) throw new DeleteMessageFailedError("Message not found");

		if (message.senderId !== client.data.user.id)
			throw new DeleteMessageFailedError(
				"You can only delete your own messages",
			);

		await this.messageRepo.delete(message.id);
		this.server.to(client.data.room).emit(Events.DELETE_MESSAGE, id);
	}
}
