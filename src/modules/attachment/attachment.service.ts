import { Injectable } from "@nestjs/common";
import { AttachmentQuery } from "./dto";
import { AttachmentRepository } from "@db/repositories";
import { DevChatCls } from "@utils";
import { AttachmentResponse } from "./dto";
import { In } from "typeorm";
import {
	AttachmentEntity,
	MessageEntity,
	DirectMessageEntity,
} from "@db/entities";
import { ClsService } from "nestjs-cls";

@Injectable()
export class AttachmentService {
	constructor(
		private readonly attachmentRepo: AttachmentRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	async findMany(
		query: AttachmentQuery,
	): Promise<[AttachmentEntity[], number]> {
		const channelId = this.cls.get("channel.id");
		const [entities, count] = await this.attachmentRepo.findAndCount({
			where: {
				channelId: channelId,
			},
			order: { createdAt: "DESC" },
			skip: (query.page - 1) * query.size,
			take: query.size,
		});

		return [entities, count];
	}

	async findOne(id: string) {
		const entity = await this.attachmentRepo.findOne({ where: { id } });
		return entity ? AttachmentResponse.fromEntity(entity as any) : null;
	}

	async addAttachmentsToMessage(
		message: MessageEntity,
		attachmentIds: string[],
	) {
		await this.attachmentRepo.update(
			{ id: In(attachmentIds) },
			{ messageId: message.id, channelId: message.channelId },
		);
	}

	async addAttachmentsToDirectMessage(
		dm: DirectMessageEntity,
		attachmentIds: string[],
	) {
		await this.attachmentRepo.update(
			{ id: In(attachmentIds) },
			{ messageId: dm.id, toUserId: dm.toUserId },
		);
	}
}
