import { DbConstants } from "@db/db-constants";
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { MessageEntity } from "./message.entity";

const { TableName, ColumnName } = DbConstants;

@Entity(TableName.Thread)
export class ThreadEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.Thread.id })
	id: string;

	@Column({ name: ColumnName.Thread.name })
	name: string;

	@Column({ name: ColumnName.Message.id })
	messageId: string;

	@OneToOne(() => MessageEntity, (message) => message.thread, {
		createForeignKeyConstraints: false,
	})
	@JoinColumn({ name: ColumnName.Message.id })
	message: MessageEntity;

	@Column({ name: ColumnName.Channel.id })
	channelId: string;

	@Column({ name: ColumnName.Audit.createdBy })
	createdById: string;

	@ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.Audit.createdBy })
	createdBy: UserEntity;

	@CreateDateColumn({ name: ColumnName.Audit.createdAt })
	createdAt: Date;
}
