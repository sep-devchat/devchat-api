import { Injectable } from "@nestjs/common";
import {
	CreateMessageRequest,
	UpdateMessageRequest,
	MessageQuery,
} from "./dto";
import { MessageRepository } from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";

@Injectable()
export class MessageService {
	constructor(
		private readonly messageRepo: MessageRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	async createOne(dto: CreateMessageRequest, senderId?: string) {
		const messageEntity = this.messageRepo.create({
			channelId: dto.channelId,
			threadId: dto.threadId,
			senderId: senderId || this.cls.get("profile").id,
			parentMessageId: dto.parentMessageId,
			content: dto.content,
		});

		return this.messageRepo.insert(messageEntity);
	}

	async updateOne(id: string | number, dto: UpdateMessageRequest) {}

	async findMany() {
		return this.messageRepo.find({
			order: {
				createdAt: "DESC",
			},
			relations: {
				sender: true,
			},
		});
	}

	async findOne(id: string | number) {
		return this.messageRepo.findOne({
			where: { id: id as string },
			relations: { sender: true },
		});
	}

	async deleteOne(id: string | number) {}
}
