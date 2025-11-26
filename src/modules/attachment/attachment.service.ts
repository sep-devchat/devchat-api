import {
	BadRequestException,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { AttachmentQuery } from "./dto";
import { AttachmentRepository } from "@db/repositories";
import { DevChatCls } from "@utils";
import { AttachmentResponse } from "./dto";
import { In } from "typeorm";
import {
	AttachmentEntity,
	MessageEntity,
	DirectMessageEntity,
	ThreadMessageEntity,
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

	private getCurrentUserId(): string {
		const profile = this.cls.get("profile");
		if (!profile?.id) {
			throw new UnauthorizedException("Missing authenticated user context");
		}
		return profile.id;
	}

	private buildDirectConversationWhereClause() {
		return `((dm.fromUserId = :currentUserId AND dm.toUserId = :targetUserId) OR (dm.fromUserId = :targetUserId AND dm.toUserId = :currentUserId))`;
	}

	private ensureValidTarget(targetUserId: string, currentUserId: string) {
		if (String(targetUserId) === String(currentUserId)) {
			throw new BadRequestException(
				"Cannot fetch direct message attachments with yourself",
			);
		}
	}

	async findManyForDirect(
		targetUserId: string,
		query: AttachmentQuery,
	): Promise<[AttachmentEntity[], number]> {
		const currentUserId = this.getCurrentUserId();
		this.ensureValidTarget(targetUserId, currentUserId);
		const qb = this.attachmentRepo
			.createQueryBuilder("attachment")
			.innerJoin(DirectMessageEntity, "dm", "dm.id = attachment.messageId")
			.where(this.buildDirectConversationWhereClause(), {
				currentUserId,
				targetUserId,
			})
			.andWhere("attachment.deletedAt IS NULL")
			.orderBy("attachment.createdAt", "DESC")
			.skip((query.page - 1) * query.size)
			.take(query.size);

		const [entities, count] = await qb.getManyAndCount();
		return [entities, count];
	}

	async findOneForDirect(id: string, targetUserId: string) {
		const currentUserId = this.getCurrentUserId();
		this.ensureValidTarget(targetUserId, currentUserId);
		const entity = await this.attachmentRepo
			.createQueryBuilder("attachment")
			.innerJoin(DirectMessageEntity, "dm", "dm.id = attachment.messageId")
			.where("attachment.id = :id", { id })
			.andWhere(this.buildDirectConversationWhereClause(), {
				currentUserId,
				targetUserId,
			})
			.andWhere("attachment.deletedAt IS NULL")
			.getOne();

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

	async addAttachmentsToThreadMessage(
		threadMessage: ThreadMessageEntity,
		attachmentIds: string[],
	) {
		await this.attachmentRepo.update(
			{ id: In(attachmentIds) },
			{
				messageId: threadMessage.id,
				channelId: threadMessage.channelId,
				threadId: threadMessage.threadId,
			},
		);
	}
}
