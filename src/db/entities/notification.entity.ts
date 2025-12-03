import { DbConstants } from "@db/db-constants";
import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.Notification)
export class NotificationEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.Notification.id })
	id: string;

	@Column({ name: ColumnName.Notification.toUserId })
	toUserId: string;

	@ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
	@Index(IndexName.Notification.userId)
	toUser: UserEntity;

	@Column({ name: ColumnName.Notification.title })
	title: string;

	@Column({ name: ColumnName.Notification.content })
	content: string;

	@Column({ name: ColumnName.Notification.notificationSource })
	notificationSource: string;

	@Column({ name: ColumnName.Notification.isRead, default: false })
	isRead: boolean;

	@CreateDateColumn({ name: ColumnName.Audit.createdAt })
	createdAt: Date;
}
