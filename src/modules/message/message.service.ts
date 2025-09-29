import { Injectable, Logger } from "@nestjs/common";
import {
	CreateMessageRequest,
	UpdateMessageRequest,
	CreateUserMessageDeleteRequest,
} from "./dto";
import {
	MessageRepository,
	UserMessageDeleteRepository,
} from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";
import { MessageNotFoundError } from "./errors";
import { UserService } from "@modules/user";

@Injectable()
export class MessageService {
	constructor(
		private readonly messageRepo: MessageRepository,
		private readonly userService: UserService,
		private readonly userMessageDeleteRepo: UserMessageDeleteRepository,
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

	// Mark message as deleted for everyone
	async deleteMessageForEveryone(id: string | number) {
		const message = await this.findOne(id);
		if (!message) {
			throw new MessageNotFoundError();
		}
		// Set deletedAt timestamp for soft delete
		message.deletedAt = new Date();

		return this.messageRepo.save(message);
	}

	private async validateBeforeCreateUserMessageDelete(
		userId: string,
		messageId: string,
	) {
		// Check if message exists
		const message = await this.findOne(messageId);
		if (!message) {
			throw new MessageNotFoundError();
		}

		// check valid user Id
		// This function already throws error if user not found
		await this.userService.findById(userId);
	}

	// Delete message for self
	async createUserMessageDelete(request: CreateUserMessageDeleteRequest) {
		const { userId, messageId } = request;

		await this.validateBeforeCreateUserMessageDelete(userId, messageId);

		const message = this.userMessageDeleteRepo.create({
			userId,
			messageId,
			deletedAt: new Date(),
		});
		return this.userMessageDeleteRepo.insert(message);
	}
}
