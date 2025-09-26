import { DbConstants } from "@db/db-constants";
import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.Message)
export class MessageEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.Message.id })
	id: string;

	@Column({ name: ColumnName.Message.channelId, type: "uuid" })
	channelId: string;

	@Column({ name: ColumnName.Message.threadId, type: "uuid", nullable: true })
	threadId: string | null;

	@Column({ name: ColumnName.Message.senderId, type: "uuid" })
	senderId: string;

	@Column({
		name: ColumnName.Message.parentMessageId,
		type: "uuid",
		nullable: true,
	})
	parentMessageId: string | null;

	@Column({ name: ColumnName.Message.content, type: "text" })
	content: string;

	@CreateDateColumn({ type: "datetime", name: ColumnName.Audit.createdAt })
	createdAt: Date;

	@UpdateDateColumn({ type: "datetime", name: ColumnName.Audit.updatedAt })
	updatedAt: Date;

	@Column({
		name: ColumnName.Audit.deletedAt,
		type: "datetime",
		nullable: true,
	})
	deletedAt: Date | null;
}
