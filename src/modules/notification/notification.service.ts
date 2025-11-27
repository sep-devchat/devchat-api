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

	private readonly notificationDebounceTimers = new Map<
		string,
		NodeJS.Timeout
	>();
	private readonly notificationMaxTimers = new Map<string, NodeJS.Timeout>();
	private readonly notificationDebounceMs = 5000;
	private readonly notificationMaxDebounceMs = 30000;

	async createOne(dto: CreateNotificationRequest): Promise<NotificationEntity> {
		const entity = this.notificationRepo.create({
			toUserId: dto.toUserId,
			title: dto.title,
			content: dto.content,
			notificationSource: dto.notificationSource,
			isRead: false,
		});
		const notification = await this.notificationRepo.save(entity);
		this.socketService.sendNotification(notification);
		return notification;
	}

	async createOrIncrementCountNotification(options: {
		toUserId: string;
		notificationSource: string;
		buildTitle: (count: number) => string;
		buildContent: (count: number) => string;
	}): Promise<NotificationEntity> {
		const existing = await this.notificationRepo.findOne({
			where: {
				toUserId: options.toUserId,
				notificationSource: options.notificationSource,
				isRead: false,
			},
		});

		if (existing) {
			const nextCount = this.extractCount(existing.content) + 1;
			existing.title = options.buildTitle(nextCount);
			existing.content = options.buildContent(nextCount);
			const saved = await this.notificationRepo.save(existing);
			this.scheduleNotificationPush(saved);
			return saved;
		}

		const entity = this.notificationRepo.create({
			toUserId: options.toUserId,
			title: options.buildTitle(1),
			content: options.buildContent(1),
			notificationSource: options.notificationSource,
			isRead: false,
		});
		const saved = await this.notificationRepo.save(entity);
		this.scheduleNotificationPush(saved);
		return saved;
	}

	private extractCount(content: string): number {
		const match = content.match(/(\d+)/);
		if (!match) return 0;
		const parsed = Number(match[1]);
		return Number.isNaN(parsed) ? 0 : parsed;
	}

	private scheduleNotificationPush(notification: NotificationEntity) {
		const key = this.buildNotificationKey(notification);
		const existingTimer = this.notificationDebounceTimers.get(key);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}
		const debounceTimer = setTimeout(() => {
			void this.flushNotification(key, notification.id);
		}, this.notificationDebounceMs);
		this.notificationDebounceTimers.set(key, debounceTimer);

		if (!this.notificationMaxTimers.has(key)) {
			const maxTimer = setTimeout(() => {
				void this.flushNotification(key, notification.id);
			}, this.notificationMaxDebounceMs);
			this.notificationMaxTimers.set(key, maxTimer);
		}
	}

	private async flushNotification(key: string, notificationId: string) {
		this.clearTimer(this.notificationDebounceTimers, key);
		this.clearTimer(this.notificationMaxTimers, key);
		try {
			const latest = await this.notificationRepo.findOne({
				where: { id: notificationId },
			});
			if (latest) {
				this.socketService.sendNotification(latest);
			}
		} catch (err) {
			console.error("[NotificationService] Failed to push notification", err);
		}
	}

	private clearTimer(store: Map<string, NodeJS.Timeout>, key: string) {
		const timer = store.get(key);
		if (timer) {
			clearTimeout(timer);
			store.delete(key);
		}
	}

	private buildNotificationKey(notification: NotificationEntity) {
		return `${notification.toUserId}:${notification.notificationSource}`;
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
