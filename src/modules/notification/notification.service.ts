import { Injectable } from "@nestjs/common";
import {
	CreateNotificationRequest,
	UpdateNotificationRequest,
	NotificationQuery,
} from "./dto";
import { NotificationRepository } from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";
import { FindOptionsWhere, In, LessThan } from "typeorm";
import { NotificationEntity } from "@db/entities";
import { SocketService } from "@modules/socket";

@Injectable()
export class NotificationService {
	constructor(
		private readonly notificationRepo: NotificationRepository,
		private readonly cls: ClsService<DevChatCls>,
		private readonly socketService: SocketService,
	) {}

	async createOne(dto: CreateNotificationRequest) {
		const entity = this.notificationRepo.create({
			toUserId: dto.toUserId,
			title: dto.title,
			content: dto.content,
			notificationSource: dto.notificationSource,
			isRead: false,
		});
		const notification = await this.notificationRepo.save(entity);
		this.socketService.sendNotification(notification);
	}

	async findMany(query: NotificationQuery): Promise<NotificationEntity[]> {
		const userId = this.cls.get("profile.id");
		const where: FindOptionsWhere<NotificationEntity> = { toUserId: userId };
		if (query.unread === true) where.isRead = false;
		if (query.cursorCreatedAt)
			where.createdAt = LessThan(new Date(query.cursorCreatedAt));
		const limit =
			query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
		const list = await this.notificationRepo.find({
			where,
			order: { createdAt: "DESC" },
			take: limit,
		});
		return list;
	}

	async findOne(id: string): Promise<NotificationEntity | null> {
		const userId = this.cls.get("profile.id");
		const entity = await this.notificationRepo.findOne({
			where: { id: id, toUserId: userId },
		});
		return entity ?? null;
	}

	async deleteOne(id: string) {
		await this.notificationRepo.delete(id);
	}

	async markReadMany(ids: string[]) {
		if (!ids?.length) return;
		await this.notificationRepo.update({ id: In(ids) }, { isRead: true });
	}

	async deleteMany(ids: string[]) {
		if (!ids?.length) return;
		await this.notificationRepo.delete({ id: In(ids) });
	}
}
