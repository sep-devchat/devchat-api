import { Injectable } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import {
	MessageRepository,
	DirectMessageRepository,
	UserRepository,
	ThreadMessageRepository,
	CodeBlockRepository,
	RunCodeCacheRepostiroy,
	GroupSubscriptionRepository,
} from "@db/repositories";
import {
	SendMessageRequest,
	EditMessageRequest,
	FetchMessagesRequest,
	MessageResponse,
	SendDirectMessageRequest,
	DirectMessageResponse,
	FetchDirectMessagesRequest,
	EditDirectMessageRequest,
	SendThreadMessageRequest,
	FetchThreadMessagesRequest,
	EditThreadMessageRequest,
	SearchMessagesRequest,
	SearchDirectMessagesRequest,
	SearchMessageResult,
} from "./dto";
import { EditMessageFailedError, DeleteMessageFailedError } from "./errors";
import { AuthService } from "@modules/auth";
import { ClsService } from "nestjs-cls";
import { DevChatCls, RunCodeTypeEnum } from "@utils";
import {
	DirectMessageEntity,
	MessageEntity,
	ThreadMessageEntity,
} from "@db/entities";
import { AiService } from "@modules/ai";
import { Socket } from "socket.io";
import { SocketEvents } from "@modules/socket/socket.constants";
import { AttachmentService } from "@modules/attachment";
import { In, Like } from "typeorm";
import { SocketService, ChatPresenceService } from "@modules/socket";
import { ThreadMessageResponse } from "./dto";
import { ChannelRepository, UserGroupRepository } from "@db/repositories";
import { NotificationService } from "@modules/notification";
import { CreateCodeBlockRequest } from "@modules/code-block/dto";

@Injectable()
export class MessageService {
	constructor(
		private readonly messageRepo: MessageRepository,
		private readonly directMessageRepo: DirectMessageRepository,
		private readonly userRepo: UserRepository,
		private readonly channelRepo: ChannelRepository,
		private readonly userGroupRepo: UserGroupRepository,
		private readonly authService: AuthService,
		private readonly cls: ClsService<DevChatCls>,
		private readonly aiService: AiService,
		private readonly attachmentService: AttachmentService,
		private readonly socketService: SocketService,
		private readonly threadMessageRepo: ThreadMessageRepository,
		private readonly codeBlockRepo: CodeBlockRepository,
		private readonly runCodeCacheRepo: RunCodeCacheRepostiroy,
		private readonly notificationService: NotificationService,
		private readonly chatPresence: ChatPresenceService,
		private readonly groupSubscriptionRepo: GroupSubscriptionRepository,
	) {}

	async getDirectMessagePeers() {
		const userId = this.cls.get("profile")?.id;
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
			relations: {
				fromUser: true,
				toUser: true,
				codeBlock: true,
				parentMessage: { fromUser: true },
			},
			order: { createdAt: "DESC" },
			take,
			skip,
		});
		return DirectMessageResponse.fromEntities(messages);
	}

	async sendMessage(
		client: Socket,
		payload: SendMessageRequest,
		server: Socket["server"],
	) {
		let message = await this.messageRepo.save({
			channelId: client.data.channel.id,
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
				thread: true,
			},
		});

		if (payload.attachmentIds && payload.attachmentIds.length > 0) {
			await this.attachmentService.addAttachmentsToMessage(
				message!,
				payload.attachmentIds,
			);
		}

		const resp = MessageResponse.fromEntity(message!);

		server.to(client.data.room).emit(SocketEvents.MESSAGE, resp);
		await this.notifyGroupMessageDigest({
			context: "channel",
			message: message!,
			groupId: client.data.group?.id ?? message!.channel.groupId,
			groupName: client.data.group?.name,
			channelName: client.data.channel?.name ?? message!.channel.name,
		});

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

			//Valudate AI access for user/group
			const message = await this.messageRepo.findOne({
				where: { id: parentMessageId },
			});

			if (!message) {
				throw new Error("Message not found for AI processing");
			}

			const channel = await this.channelRepo.findOne({
				where: { id: message.channelId },
			});
			const groupId = channel?.groupId;
			const groupSubscription = await this.groupSubscriptionRepo.findOne({
				where: { groupId },
				relations: { subscription: true },
			});
			if (!groupSubscription || !groupSubscription.subscription?.isAIActive) {
				await this.messageRepo.insert({
					channelId: client.data.channel.id,
					parentMessageId,
					senderId: aiUserId,
					content: "AI features are not enabled for this group.",
				});
				return;
			}

			const { answer } = await this.aiService.ask({
				messageId: parentMessageId,
			});

			// persist AI answer as a message in same channel/thread, parented to original
			const aiInsert = await this.messageRepo.insert({
				channelId: client.data.channel.id,
				parentMessageId,
				senderId: aiUserId,
				content: answer,
			});
			const aiMsg = await this.messageRepo.findOne({
				where: { id: aiInsert.identifiers[0].id },
				relations: {
					sender: true,
					channel: { group: true },
					parentMessage: { sender: true },
				},
			});
			if (aiMsg) {
				const aiResp = MessageResponse.fromEntity(aiMsg);
				server.to(client.data.room).emit(SocketEvents.MESSAGE, aiResp);
				await this.notifyGroupMessageDigest({
					context: "channel",
					message: aiMsg,
					groupId:
						client.data.group?.id ??
						aiMsg.channel.group?.id ??
						aiMsg.channel.groupId,
					groupName:
						client.data.group?.name ?? aiMsg.channel.group?.name ?? undefined,
					channelName: client.data.channel?.name ?? aiMsg.channel.name,
				});
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
			relations: {
				fromUser: true,
				toUser: true,
				parentMessage: { fromUser: true },
			},
		});

		if (dto.attachmentIds && dto.attachmentIds.length > 0 && dm) {
			await this.attachmentService.addAttachmentsToDirectMessage(
				dm,
				dto.attachmentIds,
			);
		}
		const resp = DirectMessageResponse.fromEntity(dm!);
		this.socketService.sendEventToUser(
			fromUser.id,
			SocketEvents.DIRECT_MESSAGE,
			resp,
		);
		this.socketService.sendEventToUser(
			dto.toUserId,
			SocketEvents.DIRECT_MESSAGE,
			resp,
		);
		await this.notifyDirectMessageDigest({
			recipientId: dto.toUserId,
			sender: dm!.fromUser,
		});
		return resp;
	}

	async editDirectMessage(
		client: Socket,
		dto: EditDirectMessageRequest,
		server: Socket["server"],
	) {
		const fromUser = client.data.user;
		if (!fromUser)
			throw new WsException({
				code: "auth_required_err",
				message: "Authenticate before editing direct messages",
			});

		let dm = await this.directMessageRepo.findOne({
			where: { id: dto.messageId },
			relations: {
				fromUser: true,
				toUser: true,
				codeBlock: true,
				parentMessage: { fromUser: true },
			},
		});
		if (!dm) throw new EditMessageFailedError("Direct message not found");
		if (dm.fromUserId !== fromUser.id)
			throw new EditMessageFailedError(
				"You can only edit your own direct messages",
			);
		if (typeof dto.codeBlock !== "undefined") {
			await this.syncDirectMessageCodeBlock(
				dm,
				dto.codeBlock,
				fromUser.id,
				dm.toUserId,
			);
		}
		if (typeof dto.attachmentIds !== "undefined") {
			await this.attachmentService.replaceDirectMessageAttachments(
				dm,
				dto.attachmentIds ?? [],
			);
		}
		dm.content = dto.content;
		dm.updatedAt = new Date();
		await this.directMessageRepo.save(dm);
		dm =
			(await this.directMessageRepo.findOne({
				where: { id: dm.id },
				relations: {
					fromUser: true,
					toUser: true,
					codeBlock: true,
					parentMessage: { fromUser: true },
				},
			})) ?? dm;
		const resp = DirectMessageResponse.fromEntity(dm);
		this.socketService.sendEventToUser(
			fromUser.id,
			SocketEvents.EDIT_DIRECT_MESSAGE,
			resp,
		);
		this.socketService.sendEventToUser(
			dm.toUserId,
			SocketEvents.EDIT_DIRECT_MESSAGE,
			resp,
		);
		return resp;
	}

	async editMessage(
		client: Socket,
		dto: EditMessageRequest,
		server: Socket["server"],
	) {
		let message = await this.messageRepo.findOne({
			where: { id: dto.messageId },
			relations: {
				sender: true,
				channel: true,
				parentMessage: { sender: true },
				thread: true,
				codeBlock: true,
			},
		});
		if (!message) throw new EditMessageFailedError("Message not found");
		if (message.senderId !== client.data.user.id)
			throw new EditMessageFailedError("You can only edit your own messages");
		if (typeof dto.codeBlock !== "undefined") {
			await this.syncMessageCodeBlock(
				message,
				dto.codeBlock,
				client.data.user.id,
			);
		}
		if (typeof dto.attachmentIds !== "undefined") {
			await this.attachmentService.replaceMessageAttachments(
				message,
				dto.attachmentIds ?? [],
			);
		}
		message.content = dto.content;
		message.updatedAt = new Date();
		await this.messageRepo.save(message);
		message =
			(await this.messageRepo.findOne({
				where: { id: message.id },
				relations: {
					sender: true,
					channel: true,
					parentMessage: { sender: true },
					thread: true,
				},
			})) ?? message;
		const response = MessageResponse.fromEntity(message);
		server.to(client.data.room).emit(SocketEvents.EDIT_MESSAGE, {
			messageId: message.id,
			...response,
		});
	}

	async deleteMessage(client: Socket, id: string, server: Socket["server"]) {
		const message = await this.messageRepo.findOne({
			where: { id },
		});
		if (!message) throw new DeleteMessageFailedError("Message not found");
		if (message.senderId !== client.data.user.id)
			throw new DeleteMessageFailedError(
				"You can only delete your own messages",
			);
		await this.attachmentService.removeAttachmentsForMessage(message.id);
		await this.syncMessageCodeBlock(message, null, message.senderId);
		await this.messageRepo.delete(message.id);
		server.to(client.data.room).emit(SocketEvents.DELETE_MESSAGE, id);
	}

	async deleteDirectMessage(
		client: Socket,
		id: string,
		server: Socket["server"],
	) {
		const user = client.data.user;
		if (!user)
			throw new WsException({
				code: "auth_required_err",
				message: "Authenticate before deleting direct messages",
			});
		const directMessage = await this.directMessageRepo.findOne({
			where: { id },
		});
		if (!directMessage)
			throw new DeleteMessageFailedError("Direct message not found");
		if (directMessage.fromUserId !== user.id)
			throw new DeleteMessageFailedError(
				"You can only delete your own direct messages",
			);
		await this.attachmentService.removeAttachmentsForDirectMessage(
			directMessage.id,
		);
		await this.syncDirectMessageCodeBlock(
			directMessage,
			null,
			user.id,
			directMessage.toUserId,
		);
		await this.directMessageRepo.delete(directMessage.id);
		this.socketService.sendEventToUser(
			user.id,
			SocketEvents.DELETE_DIRECT_MESSAGE,
			id,
		);
		this.socketService.sendEventToUser(
			directMessage.toUserId,
			SocketEvents.DELETE_DIRECT_MESSAGE,
			id,
		);
		return id;
	}

	async sendThreadMessage(
		client: Socket,
		dto: SendThreadMessageRequest,
		server: Socket["server"],
	) {
		if (!client.data.channel)
			throw new WsException({
				code: "channel_not_selected_err",
				message: "Join a channel before sending thread messages",
			});
		if (!client.data.user)
			throw new WsException({
				code: "auth_required_err",
				message: "Authenticate before sending thread messages",
			});

		// Persist thread message
		let threadMessage = await this.threadMessageRepo.save({
			threadId: dto.threadId,
			channelId: client.data.channel.id,
			senderId: client.data.user.id,
			content: dto.content,
			codeBlock: dto.codeBlock
				? {
						content: dto.codeBlock.content,
						language: dto.codeBlock.language,
						channelId: client.data.channel.id,
						userId: client.data.user.id,
					}
				: undefined,
			parentMessageId: dto.parentMessageId ?? null,
		});

		threadMessage = await this.threadMessageRepo.findOne({
			where: { id: threadMessage.id },
			relations: {
				sender: true,
				codeBlock: true,
				parentMessage: { sender: true },
			},
		});

		if (dto.attachmentIds && dto.attachmentIds.length > 0 && threadMessage) {
			await this.attachmentService.addAttachmentsToThreadMessage(
				threadMessage,
				dto.attachmentIds,
			);
		}

		server
			.to(client.data.room)
			.emit(
				SocketEvents.SEND_THREAD_MESSAGE,
				ThreadMessageResponse.fromEntity(threadMessage!),
			);

		await this.notifyGroupMessageDigest({
			context: "thread",
			message: {
				channelId: client.data.channel.id,
				senderId: threadMessage!.senderId,
			},
			groupId: client.data.group?.id ?? client.data.channel.groupId,
			groupName: client.data.group?.name,
			channelName: client.data.channel?.name,
			threadId: dto.threadId,
		});
	}

	async fetchThreadMessages(client: Socket, dto: FetchThreadMessagesRequest) {
		if (!client.data.channel)
			throw new WsException({
				code: "channel_not_selected_err",
				message: "Join a channel before fetching thread messages",
			});
		if (!client.data.user)
			throw new WsException({
				code: "auth_required_err",
				message: "Authenticate before fetching thread messages",
			});
		if (!dto.threadId)
			throw new WsException({
				code: "thread_required_err",
				message: "Provide a threadId to fetch thread messages",
			});

		const take = dto?.take && dto.take > 0 ? Math.min(dto.take, 100) : 50;
		const page = dto?.page && dto.page > 0 ? dto.page : 1;
		const skip = (page - 1) * take;

		const messages = await this.threadMessageRepo.find({
			where: { threadId: dto.threadId, channelId: client.data.channel.id },
			relations: {
				sender: true,
				codeBlock: true,
				parentMessage: { sender: true },
			},
			order: { createdAt: "DESC" },
			take,
			skip,
		});
		return ThreadMessageResponse.fromEntities(messages);
	}

	async searchMessages(
		dto: SearchMessagesRequest,
	): Promise<{ items: SearchMessageResult[]; total: number }> {
		const channelId = dto.channelId;
		if (!channelId)
			throw new WsException({
				code: "channel_required_err",
				message: "Provide a channelId to search messages",
			});

		const userId = this.cls.get("profile")?.id;
		if (!userId)
			throw new WsException({
				code: "auth_required_err",
				message: "Authenticate before searching messages",
			});

		const channel = await this.channelRepo.findOne({
			where: { id: channelId },
		});
		if (!channel)
			throw new WsException({
				code: "channel_not_found_err",
				message: "Channel not found",
			});

		// Verify user membership in the group owning the channel
		const membership = await this.userGroupRepo.findOne({
			where: { userId, groupId: (channel as any).groupId },
		});
		if (!membership)
			throw new WsException({
				code: "channel_search_forbidden_err",
				message: "You are not a member of this channel's group",
			});
		const q = dto.q?.trim();
		if (!q) return { items: [], total: 0 };
		const take = dto?.take && dto.take > 0 ? Math.min(dto.take, 100) : 50;
		const page = dto?.page && dto.page > 0 ? dto.page : 1;
		const skip = (page - 1) * take;

		// Use raw UNION for consistent pagination across both tables
		const pattern = `%${q}%`;
		// Use underlying repository query method (no direct DataSource injection)
		const raw = await this.messageRepo.query(
			`(
				SELECT m.message_id AS id, 'message' AS type, m.created_at AS createdAt
				FROM message m
				WHERE m.channel_id = ? AND m.content LIKE ?
			)
			UNION ALL
			(
				SELECT tm.thread_message_id AS id, 'thread_message' AS type, tm.created_at AS createdAt
				FROM thread_message tm
				WHERE tm.channel_id = ? AND tm.content LIKE ?
			)
			ORDER BY createdAt DESC
			LIMIT ? OFFSET ?`,
			[channelId, pattern, channelId, pattern, take, skip],
		);

		if (!raw.length) {
			return { items: [], total: 0 };
		}

		const messageIds: string[] = [];
		const threadMessageIds: string[] = [];
		for (const row of raw) {
			if (row.type === "message") messageIds.push(row.id);
			else if (row.type === "thread_message") threadMessageIds.push(row.id);
		}

		// Fetch entities preserving relations similar to fetch methods
		const messages = messageIds.length
			? await this.messageRepo.find({
					where: { id: In(messageIds) },
					relations: {
						sender: true,
						parentMessage: { sender: true },
						thread: true,
					},
				})
			: [];
		const threadMessages = threadMessageIds.length
			? await this.threadMessageRepo.find({
					where: { id: In(threadMessageIds) },
					relations: { sender: true, codeBlock: true },
				})
			: [];

		const mapMessage = new Map(messages.map((m) => [m.id, m] as const));
		const mapThread = new Map(threadMessages.map((t) => [t.id, t] as const));

		// Reconstruct ordered unified results
		const unified: SearchMessageResult[] = raw
			.map((row: any) => {
				if (row.type === "message") {
					const ent = mapMessage.get(row.id);
					return ent ? SearchMessageResult.fromMessage(ent) : null;
				}
				const ent = mapThread.get(row.id);
				return ent ? SearchMessageResult.fromThreadMessage(ent) : null;
			})
			.filter((r): r is SearchMessageResult => !!r);

		// Total count for pagination: sum of counts from both tables with same filter
		const messageCount = await this.messageRepo.count({
			where: { channelId, content: Like(pattern) },
		});
		const threadMessageCount = await this.threadMessageRepo.count({
			where: { channelId, content: Like(pattern) },
		});
		return { items: unified, total: messageCount + threadMessageCount };
	}

	async searchDirectMessages(
		dto: SearchDirectMessagesRequest,
	): Promise<{ items: DirectMessageResponse[]; total: number }> {
		const userId = this.cls.get("profile")?.id;
		if (!userId)
			throw new WsException({
				code: "auth_required_err",
				message: "Authenticate before searching direct messages",
			});
		if (!dto.targetUserId)
			throw new WsException({
				code: "target_user_required_err",
				message: "Provide a targetUserId to search direct messages",
			});
		if (dto.targetUserId === userId)
			throw new WsException({
				code: "invalid_target_err",
				message: "Cannot search direct messages with yourself",
			});
		const q = dto.q?.trim();
		if (!q) return { items: [], total: 0 };
		const take = dto?.take && dto.take > 0 ? Math.min(dto.take, 100) : 50;
		const page = dto?.page && dto.page > 0 ? dto.page : 1;
		const skip = (page - 1) * take;

		const pattern = `%${q}%`;
		const messages = await this.directMessageRepo.find({
			where: [
				{
					fromUserId: userId,
					toUserId: dto.targetUserId,
					content: Like(pattern),
				},
				{
					fromUserId: dto.targetUserId,
					toUserId: userId,
					content: Like(pattern),
				},
			],
			relations: {
				fromUser: true,
				toUser: true,
				codeBlock: true,
				parentMessage: { fromUser: true },
			},
			order: { createdAt: "DESC" },
			take,
			skip,
		});
		const total = await this.directMessageRepo.count({
			where: [
				{
					fromUserId: userId,
					toUserId: dto.targetUserId,
					content: Like(pattern),
				},
				{
					fromUserId: dto.targetUserId,
					toUserId: userId,
					content: Like(pattern),
				},
			],
		});
		return { items: DirectMessageResponse.fromEntities(messages), total };
	}

	async editThreadMessage(client: Socket, dto: EditThreadMessageRequest) {
		if (!client.data.user)
			throw new WsException({
				code: "auth_required_err",
				message: "Authenticate before editing thread messages",
			});
		let tm = await this.threadMessageRepo.findOne({
			where: { id: dto.threadMessageId },
			relations: {
				sender: true,
				codeBlock: true,
				parentMessage: { sender: true },
			},
		});
		if (!tm) throw new EditMessageFailedError("Thread message not found");
		if (tm.senderId !== client.data.user.id)
			throw new EditMessageFailedError(
				"You can only edit your own thread messages",
			);
		if (typeof dto.codeBlock !== "undefined") {
			await this.syncThreadMessageCodeBlock(
				tm,
				dto.codeBlock,
				client.data.user.id,
			);
		}
		if (typeof dto.attachmentIds !== "undefined") {
			await this.attachmentService.replaceThreadMessageAttachments(
				tm,
				dto.attachmentIds ?? [],
			);
		}
		tm.content = dto.content;
		tm.updatedAt = new Date();
		await this.threadMessageRepo.save(tm);
		tm =
			(await this.threadMessageRepo.findOne({
				where: { id: tm.id },
				relations: {
					sender: true,
					codeBlock: true,
					parentMessage: { sender: true },
				},
			})) ?? tm;
		const resp = ThreadMessageResponse.fromEntity(tm);
		client.nsp.server
			.to(client.data.room)
			.emit(SocketEvents.EDIT_THREAD_MESSAGE, resp);
		return resp;
	}

	async deleteThreadMessage(client: Socket, id: string) {
		if (!client.data.user)
			throw new WsException({
				code: "auth_required_err",
				message: "Authenticate before deleting thread messages",
			});
		console.log("Deleting thread message with id:", id);
		const tm = await this.threadMessageRepo.findOne({ where: { id } });
		if (!tm) throw new DeleteMessageFailedError("Thread message not found");
		if (tm.senderId !== client.data.user.id)
			throw new DeleteMessageFailedError(
				"You can only delete your own thread messages",
			);
		await this.attachmentService.removeAttachmentsForThreadMessage(tm.id);
		await this.syncThreadMessageCodeBlock(tm, null, client.data.user.id);
		await this.threadMessageRepo.delete(id);
		client.nsp.server
			.to(client.data.room)
			.emit(SocketEvents.DELETE_THREAD_MESSAGE, id);
		return id;
	}

	private async syncMessageCodeBlock(
		message: MessageEntity,
		codeBlockInput: CreateCodeBlockRequest | null,
		userId: string,
	) {
		if (codeBlockInput === null) {
			if (message.codeBlockId) {
				await this.clearCodeBlockCache(message.codeBlockId);
				await this.codeBlockRepo.delete(message.codeBlockId);
			}
			message.codeBlock = null;
			message.codeBlockId = null;
			return;
		}

		if (!codeBlockInput) return;

		if (message.codeBlock) {
			message.codeBlock.content = codeBlockInput.content;
			message.codeBlock.language = codeBlockInput.language;
			await this.clearCodeBlockCache(message.codeBlock.id);
			return;
		}

		const created = this.codeBlockRepo.create({
			content: codeBlockInput.content,
			language: codeBlockInput.language,
			userId,
			channelId: message.channelId,
		});
		message.codeBlock = created;
	}

	private async syncDirectMessageCodeBlock(
		directMessage: DirectMessageEntity,
		codeBlockInput: CreateCodeBlockRequest | null,
		userId: string,
		targetUserId: string,
	) {
		if (codeBlockInput === null) {
			if (directMessage.codeBlockId) {
				await this.clearCodeBlockCache(directMessage.codeBlockId);
				await this.codeBlockRepo.delete(directMessage.codeBlockId);
			}
			directMessage.codeBlock = null;
			directMessage.codeBlockId = null;
			return;
		}

		if (!codeBlockInput) return;

		if (directMessage.codeBlock) {
			directMessage.codeBlock.content = codeBlockInput.content;
			directMessage.codeBlock.language = codeBlockInput.language;
			await this.clearCodeBlockCache(directMessage.codeBlock.id);
			return;
		}

		const created = this.codeBlockRepo.create({
			content: codeBlockInput.content,
			language: codeBlockInput.language,
			userId,
			toUserId: targetUserId,
		});
		directMessage.codeBlock = created;
	}

	private async syncThreadMessageCodeBlock(
		threadMessage: ThreadMessageEntity,
		codeBlockInput: CreateCodeBlockRequest | null,
		userId: string,
	) {
		if (codeBlockInput === null) {
			if (threadMessage.codeBlockId) {
				await this.clearCodeBlockCache(threadMessage.codeBlockId);
				await this.codeBlockRepo.delete(threadMessage.codeBlockId);
			}
			threadMessage.codeBlock = null;
			threadMessage.codeBlockId = null;
			return;
		}

		if (!codeBlockInput) return;

		if (threadMessage.codeBlock) {
			threadMessage.codeBlock.content = codeBlockInput.content;
			threadMessage.codeBlock.language = codeBlockInput.language;
			await this.clearCodeBlockCache(threadMessage.codeBlock.id);
			return;
		}

		const created = this.codeBlockRepo.create({
			content: codeBlockInput.content,
			language: codeBlockInput.language,
			userId,
			channelId: threadMessage.channelId,
		});
		threadMessage.codeBlock = created;
	}

	private async clearCodeBlockCache(codeBlockId?: string | null) {
		if (!codeBlockId) return;
		await this.runCodeCacheRepo.delete({
			targetId: codeBlockId,
			runCodeType: RunCodeTypeEnum.CODE_BLOCK,
		});
	}

	private async notifyGroupMessageDigest(params: {
		context: "channel" | "thread";
		message: Pick<MessageEntity, "channelId" | "senderId">;
		groupId?: string;
		groupName?: string;
		channelName?: string;
		threadId?: string;
	}) {
		const { groupId } = params;
		if (!groupId) return;

		const members = await this.userRepo.find({
			where: { userGroups: { groupId } },
		});
		if (!members.length) return;

		const noun = params.context === "thread" ? "thread message" : "message";
		const pluralized = (count: number) =>
			`${count} new ${noun}${count > 1 ? "s" : ""}`;
		const channelLabel = params.channelName?.trim() || undefined;
		const groupLabel = params.groupName ?? "this group";
		const baseSource = `/chat/group/${groupId}?channel=${params.message.channelId}`;
		const notificationSource = params.threadId
			? `${baseSource}&thread=${params.threadId}`
			: baseSource;
		const channelSuffix = channelLabel ? ` (#${channelLabel})` : "";
		const titleChannel = channelLabel ? `#${channelLabel}` : "this channel";

		const recipients = members.filter((member) => {
			if (member.id === params.message.senderId) return false;
			if (
				params.groupId &&
				this.chatPresence.isViewingGroupChannel(
					member.id,
					params.groupId,
					params.message.channelId,
				)
			)
				return false;
			if (
				params.context === "thread" &&
				params.threadId &&
				this.chatPresence.isViewingThread(
					member.id,
					params.message.channelId,
					params.threadId,
				)
			)
				return false;
			return true;
		});
		if (!recipients.length) return;

		await Promise.all(
			recipients.map((member) =>
				this.notificationService.createOrIncrementCountNotification({
					toUserId: member.id,
					notificationSource,
					buildTitle: (count) => `${pluralized(count)} in ${titleChannel}`,
					buildContent: (count) =>
						`You have ${count} new ${noun}${count > 1 ? "s" : ""} in group ${groupLabel}${channelSuffix}`,
				}),
			),
		);
	}

	private async notifyDirectMessageDigest(params: {
		recipientId: string;
		sender: {
			id: string;
			firstName?: string | null;
			lastName?: string | null;
			username?: string | null;
			email?: string | null;
		};
	}) {
		if (
			this.chatPresence.isViewingDirectConversation(
				params.recipientId,
				params.sender.id,
			)
		)
			return;
		await this.notificationService.createOrIncrementCountNotification({
			toUserId: params.recipientId,
			notificationSource: `/chat/user/${params.sender.id}`,
			buildTitle: (count) =>
				`${count} new direct message${count > 1 ? "s" : ""}`,
			buildContent: (count) =>
				`You have ${count} new direct message${count > 1 ? "s" : ""} from ${this.getUserDisplayName(params.sender)}`,
		});
	}

	private getUserDisplayName(user: {
		firstName?: string | null;
		lastName?: string | null;
		username?: string | null;
		email?: string | null;
	}) {
		const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`
			.trim()
			.replace(/\s+/g, " ");
		if (fullName) return fullName;
		if (user.username) return `@${user.username}`;
		return user.email ?? "this user";
	}
}
