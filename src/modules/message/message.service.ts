import { Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import {
	MessageRepository,
	DirectMessageRepository,
	UserRepository,
} from "@db/repositories";
import { SendMessageRequest } from "./dto/send-message.request";
import { EditMessageRequest } from "./dto/edit-message.request";
import { FetchMessagesRequest } from "./dto/fetch-messages.request";
import { MessageResponse } from "./dto/message.response";
import { SendDirectMessageRequest } from "./dto/send-direct-message.request";
import { DirectMessageResponse } from "./dto/direct-message.response";
import { FetchDirectMessagesRequest } from "./dto/fetch-direct-messages.request";
import { EditMessageFailedError, DeleteMessageFailedError } from "./errors";
import { AuthService } from "@modules/auth";
import { MessageEntity } from "@db/entities";
import { constructUserRoomName } from "@utils";
import { AiService } from "@modules/ai";
import { Socket } from "socket.io";
import { SocketConstants } from "@modules/socket/socket.constants";
import { AttachmentService } from "@modules/attachment";
import { In } from "typeorm";

const { Events } = SocketConstants;

@Injectable()
export class MessageService {
	constructor(
		private readonly messageRepo: MessageRepository,
		private readonly directMessageRepo: DirectMessageRepository,
		private readonly userRepo: UserRepository,
		private readonly authService: AuthService,
		private readonly aiService: AiService,
		private readonly attachmentService: AttachmentService,
	) {}

	/**
	 * Return distinct users that the current user has direct message history with,
	 * sorted by most recent conversation activity (latest DM createdAt).
	 */
	async getDirectMessagePeers() {
		const userId = this.authService.getProfileCls()?.id;
		if (!userId) {
			throw new WsException({
				code: "auth_required_err",
				message: "Authenticate before fetching direct message peers",
			});
		}

		// Get distinct peer ids and last activity timestamp
		const rows = await this.directMessageRepo
			.createQueryBuilder("dm")
			.select(
				"CASE WHEN dm.fromUserId = :userId THEN dm.toUserId ELSE dm.fromUserId END",
				"peerId",
			)
			.addSelect("MAX(dm.createdAt)", "lastAt")
			.where("dm.fromUserId = :userId OR dm.toUserId = :userId", { userId })
			.groupBy("peerId")
			.orderBy("lastAt", "DESC")
			.getRawMany<{ peerId: string; lastAt: string }>();

		if (!rows.length) return [];

		const peerIds = rows.map((r) => r.peerId);
		const users = await this.userRepo.findBy({ id: In(peerIds) });
		const mapById = new Map(users.map((u) => [u.id, u] as const));

		// Preserve order by last activity
		const orderedUsers = rows
			.map((r) => mapById.get(r.peerId))
			.filter((u): u is NonNullable<typeof u> => !!u);

		return orderedUsers.map((u) => ({
			id: u.id,
			username: u.username,
			email: u.email,
			firstName: u.firstName,
			lastName: u.lastName,
			avatarUrl: u.avatarUrl ?? undefined,
			isActive: u.isActive,
			emailVerified: u.emailVerified,
			createdAt: u.createdAt,
			updatedAt: u.updatedAt,
			lastLogin: u.lastLogin ?? undefined,
			timezone: u.timezone ?? undefined,
			isAdmin: u.isAdmin,
		}));
	}

	async fetchMessages(client: Socket, dto: FetchMessagesRequest) {
		if (!client.data.channel)
			throw new WsException({
				code: "channel_not_selected_err",
				message: "Join a channel before fetching messages",
			});
		const take = dto?.take && dto.take > 0 ? Math.min(dto.take, 100) : 50; // cap page size
		const page = dto?.page && dto.page > 0 ? dto.page : 1;
		const skip = (page - 1) * take;
		const messages = await this.messageRepo.find({
			where: { channelId: client.data.channel.id },
			relations: { sender: true, parentMessage: { sender: true } },
			order: { createdAt: "DESC" },
			take,
			skip,
		});
		return MessageResponse.fromEntities(messages);
	}

	async fetchDirectMessages(client: Socket, dto: FetchDirectMessagesRequest) {
		const userId = client.data.user?.id;
		if (!userId)
			throw new WsException({
				code: "user_not_set_err",
				message: "Authenticate before fetching direct messages",
			});
		if (!dto?.targetUserId)
			throw new WsException({
				code: "target_user_required_err",
				message: "Provide a targetUserId to fetch direct messages",
			});
		if (dto.targetUserId === userId)
			throw new WsException({
				code: "invalid_target_err",
				message: "Cannot fetch direct messages with yourself",
			});

		const take = dto?.take && dto.take > 0 ? Math.min(dto.take, 100) : 50;
		const page = dto?.page && dto.page > 0 ? dto.page : 1;
		const skip = (page - 1) * take;

		const messages = await this.directMessageRepo.find({
			where: [
				{ fromUserId: userId, toUserId: dto.targetUserId },
				{ fromUserId: dto.targetUserId, toUserId: userId },
			],
			relations: { fromUser: true, toUser: true, codeBlock: true },
			order: { createdAt: "DESC" },
			take,
			skip,
		});
		return DirectMessageResponse.fromEntities(messages);
	}

	async createMessageNotification(
		message: MessageEntity,
		server: Socket["server"],
	) {
		const listUsers = await this.userRepo.find({
			where: { userGroups: { groupId: message.channel.groupId } },
		});
		listUsers.forEach((user) => {
			if (user.id !== message.senderId) {
				server
					.to(constructUserRoomName(user.id))
					.emit(
						Events.MESSAGE_NOTIFICATION,
						MessageResponse.fromEntity(message),
					);
			}
		});
	}

	async sendMessage(
		client: Socket,
		payload: SendMessageRequest,
		server: Socket["server"],
	) {
		let message = await this.messageRepo.save({
			channelId: client.data.channel.id,
			threadId: payload.threadId,
			parentMessageId: payload.parentMessageId,
			senderId: client.data.user.id,
			content: payload.content,
			codeBlock: payload.codeBlock
				? {
						content: payload.codeBlock.content,
						language: payload.codeBlock.language,
						channelId: client.data.channel.id,
						userId: client.data.user.id,
					}
				: undefined,
		});

		message = await this.messageRepo.findOne({
			where: { id: message.id },
			relations: {
				sender: true,
				channel: true,
				parentMessage: { sender: true },
			},
		});

		if (payload.attachmentIds && payload.attachmentIds.length > 0) {
			await this.attachmentService.addAttachmentsToMessage(
				message!,
				payload.attachmentIds,
			);
		}

		const resp = MessageResponse.fromEntity(message!);

		server.to(client.data.room).emit(Events.MESSAGE, resp);
		this.createMessageNotification(message!, server);

		// Delegate AI mention handling to helper
		await this.maybeProcessAiMentionAndRespond(
			client,
			payload,
			server,
			message.id,
		);
	}

	/**
	 * If the message mentions an AI provider (@openai or @gemini), run inference and
	 * send the AI's answer as a new message in the same channel/thread, parented to the original.
	 */
	private async maybeProcessAiMentionAndRespond(
		client: Socket,
		payload: SendMessageRequest,
		server: Socket["server"],
		parentMessageId: string,
	): Promise<void> {
		const isAiMention =
			payload.content.includes("@openai") ||
			payload.content.includes("@gemini");
		if (!isAiMention) return;

		try {
			const { answer } = await this.aiService.ask({
				messageId: parentMessageId,
			});
			// Determine which AI provider was mentioned and map to a system AI user id.
			// Expect environment variables OPENAI_USER_ID / GEMINI_USER_ID to hold user IDs of
			// dedicated AI accounts. Fallback to original sender if not configured so flow still works.
			let aiUserId: string | undefined;
			const aiUser = await this.userRepo.findOne({
				where: {
					username: payload.content.includes("@openai")
						? "openai-bot"
						: "gemini-bot",
				},
			});
			aiUserId = aiUser?.id || client.data.user.id;

			// persist AI answer as a message in same channel/thread, parented to original
			const aiInsert = await this.messageRepo.insert({
				channelId: client.data.channel.id,
				threadId: payload.threadId ?? null,
				parentMessageId,
				senderId: aiUserId,
				content: answer,
			});
			const aiMsg = await this.messageRepo.findOne({
				where: { id: aiInsert.identifiers[0].id },
				relations: { sender: true, channel: { group: true } },
			});
			if (aiMsg) {
				const aiResp = MessageResponse.fromEntity(aiMsg);
				server.to(client.data.room).emit(Events.MESSAGE, aiResp);
				this.createMessageNotification(aiMsg, server);
			}
		} catch (err) {
			// Swallow AI failures to avoid breaking the user send flow
			console.error(
				"[MessageService] AI processing failed for message",
				parentMessageId,
				err,
			);
		}
	}

	async sendDirectMessage(
		client: Socket,
		dto: SendDirectMessageRequest,
		server: Socket["server"],
	) {
		const fromUser = client.data.user;
		if (!fromUser)
			throw new WsException({
				code: "auth_required_err",
				message: "Authenticate before sending direct messages",
			});
		if (fromUser.id === dto.toUserId)
			throw new WsException({
				code: "invalid_recipient_err",
				message: "Cannot send a direct message to yourself",
			});

		let dm = await this.directMessageRepo.save({
			fromUserId: fromUser.id,
			toUserId: dto.toUserId,
			content: dto.content,
			parentMessageId: dto.parentMessageId ?? null,
			codeBlock: dto.codeBlock
				? {
						content: dto.codeBlock.content,
						language: dto.codeBlock.language,
						userId: fromUser.id,
						toUserId: dto.toUserId,
					}
				: undefined,
		});

		dm = await this.directMessageRepo.findOne({
			where: { id: dm.id },
			relations: { fromUser: true, toUser: true },
		});

		if (dto.attachmentIds && dto.attachmentIds.length > 0 && dm) {
			await this.attachmentService.addAttachmentsToDirectMessage(
				dm,
				dto.attachmentIds,
			);
		}
		const resp = DirectMessageResponse.fromEntity(dm!);
		server
			.to(constructUserRoomName(fromUser.id))
			.emit(Events.DIRECT_MESSAGE, resp);
		server
			.to(constructUserRoomName(dto.toUserId))
			.emit(Events.DIRECT_MESSAGE, resp);
		return resp;
	}

	async editMessage(
		client: Socket,
		dto: EditMessageRequest,
		server: Socket["server"],
	) {
		const message = await this.messageRepo.findOne({
			where: { id: dto.messageId },
			relations: {
				sender: true,
				channel: { group: true },
				parentMessage: { sender: true },
			},
		});
		if (!message) throw new EditMessageFailedError("Message not found");
		if (message.senderId !== client.data.user.id)
			throw new EditMessageFailedError("You can only edit your own messages");
		message.content = dto.content;
		message.updatedAt = new Date();
		await this.messageRepo.save(message);
		server
			.to(client.data.room)
			.emit(Events.EDIT_MESSAGE, MessageResponse.fromEntity(message));
	}

	async deleteMessage(client: Socket, id: string, server: Socket["server"]) {
		const message = await this.messageRepo.findOne({
			where: { id },
			relations: {
				sender: true,
				channel: { group: true },
				parentMessage: { sender: true },
			},
		});
		if (!message) throw new DeleteMessageFailedError("Message not found");
		if (message.senderId !== client.data.user.id)
			throw new DeleteMessageFailedError(
				"You can only delete your own messages",
			);
		await this.messageRepo.delete(message.id);
		server.to(client.data.room).emit(Events.DELETE_MESSAGE, id);
	}
}
