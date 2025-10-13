import { Injectable } from "@nestjs/common";
import {
	CreateMessageRequest,
	UpdateMessageRequest,
	CreateUserMessageDeleteRequest,
	MessageQuery,
} from "./dto";
import {
	MessageRepository,
	UserMessageDeleteRepository,
} from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";
import { MessageNotFoundError } from "./errors";
import { Between, FindOptionsWhere } from "typeorm";
import { MessageEntity } from "@db/entities";
import dayjs from "dayjs";

@Injectable()
export class MessageService {
	constructor(
		private readonly messageRepo: MessageRepository,
		private readonly userMessageDeleteRepo: UserMessageDeleteRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	async createOne(dto: CreateMessageRequest, senderId?: string) {
		const channelId = this.cls.get("channel").id || dto.channelId;
		const messageEntity = this.messageRepo.create({
			channelId,
			threadId: dto.threadId,
			senderId: senderId || this.cls.get("profile").id,
			parentMessageId: dto.parentMessageId,
			content: dto.content,
		});

		return this.messageRepo.insert(messageEntity);
	}

	async updateOne(id: string, dto: UpdateMessageRequest) {
		await this.findOne(id, true);

		return this.messageRepo.update(id, {
			content: dto.content,
			updatedAt: new Date(),
		});
	}

	async findMany(query: MessageQuery) {
		const channelId = this.cls.get("channel").id;
		const whereObj: FindOptionsWhere<MessageEntity> = {};

		if (query.threadId) {
			whereObj.threadId = query.threadId;
		} else {
			whereObj.channelId = channelId;
		}

		// if (query.timestamp) {
		// 	const end = dayjs(query.timestamp);
		// 	const start = end.subtract(8, "hour");

		// 	whereObj.createdAt = Between(start.toDate(), end.toDate());
		// }

		return this.messageRepo.find({
			where: whereObj,
			order: {
				createdAt: "DESC",
			},
			relations: {
				sender: true,
			},
		});
	}

	async findOne(id: string, owned: boolean = false) {
		const message = await this.messageRepo.findOne({
			where: { id: id as string },
			relations: { sender: true },
		});
		if (
			!message ||
			(owned && message.senderId !== this.cls.get("profile").id)
		) {
			throw new MessageNotFoundError();
		}
		return message;
	}

	// Mark message as deleted for everyone
	async deleteMessageForEveryone(id: string) {
		await this.findOne(id, true);
		await this.messageRepo.delete(id);
	}

	async createUserMessageDelete(request: CreateUserMessageDeleteRequest) {
		const { messageId } = request;

		const userId = this.cls.get("profile").id;

		await this.findOne(messageId, true);

		const message = this.userMessageDeleteRepo.create({
			userId,
			messageId,
			deletedAt: new Date(),
		});
		return this.userMessageDeleteRepo.insert(message);
	}
}
