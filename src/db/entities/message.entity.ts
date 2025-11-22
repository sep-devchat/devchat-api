import { DbConstants } from "@db/db-constants";
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { ChannelEntity } from "./channel.entity";
import { ThreadEntity } from "./thread.entity";
import { CodeBlockEntity } from "./code-block.entity";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.Message)
export class MessageEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.Message.id })
	id: string;

	@Column({ name: ColumnName.Channel.id, type: "uuid" })
	channelId: string;

	@ManyToOne(() => ChannelEntity)
	@JoinColumn({ name: ColumnName.Channel.id })
	channel: ChannelEntity;

	@OneToOne(() => ThreadEntity, (thread) => thread.message, { nullable: true })
	thread: ThreadEntity | null;

	@Column({
		name: ColumnName.Message.parentMessageId,
		type: "uuid",
		nullable: true,
	})
	parentMessageId: string | null;

	@ManyToOne(() => MessageEntity, { nullable: true })
	@JoinColumn({ name: ColumnName.Message.parentMessageId })
	parentMessage: MessageEntity | null;

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

	@Column({ name: ColumnName.Message.senderId, type: "uuid" })
	senderId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({ name: ColumnName.Message.senderId })
	sender: UserEntity;

	@Column({ name: ColumnName.CodeBlock.id, type: "uuid", nullable: true })
	codeBlockId: string;

	@OneToOne(() => CodeBlockEntity, (codeBlock) => codeBlock.message, {
		nullable: true,
		cascade: true,
	})
	@JoinColumn({ name: ColumnName.CodeBlock.id })
	codeBlock: CodeBlockEntity;
}
