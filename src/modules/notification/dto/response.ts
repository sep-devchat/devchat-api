import { ApiProperty } from "@nestjs/swagger";
import { NotificationEntity } from "@db/entities";

export class NotificationResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	toUserId: string;

	@ApiProperty()
	title: string;

	@ApiProperty()
	content: string;

	@ApiProperty()
	notificationSource: string;

	@ApiProperty()
	isRead: boolean;

	@ApiProperty()
	createdAt: Date;

	static fromEntity(e: NotificationEntity): NotificationResponse {
		return {
			id: e.id,
			toUserId: e.toUserId,
			title: e.title,
			content: e.content,
			notificationSource: e.notificationSource,
			isRead: e.isRead,
			createdAt: e.createdAt,
		};
	}

	static fromEntities(list: NotificationEntity[]): NotificationResponse[] {
		return list.map(this.fromEntity);
	}
}
