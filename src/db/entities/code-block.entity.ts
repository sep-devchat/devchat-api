import { DbConstants } from "@db/db-constants";
import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { MessageEntity } from "./message.entity";
import { DirectMessageEntity } from "./direct-message.entity";
import { ThreadMessageEntity } from "./thread-message.entity";

const { TableName, ColumnName } = DbConstants;

@Entity(TableName.CodeBlock)
export class CodeBlockEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.CodeBlock.id })
	id: string;

	@Column({ name: ColumnName.CodeBlock.userId, type: "uuid" })
	userId: string;

	@Column({ name: ColumnName.CodeBlock.toUserId, type: "uuid", nullable: true })
	toUserId: string;

	@ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.CodeBlock.userId })
	user: UserEntity;

	@OneToOne(() => MessageEntity, (message) => message.codeBlock, {
		onDelete: "CASCADE",
		createForeignKeyConstraints: false,
	})
	message: MessageEntity;

	@OneToOne(() => DirectMessageEntity, (dm) => dm.codeBlock, {
		onDelete: "CASCADE",
		createForeignKeyConstraints: false,
	})
	directMessage: DirectMessageEntity;

	@OneToOne(() => ThreadMessageEntity, (tm) => tm.codeBlock, {
		onDelete: "CASCADE",
		createForeignKeyConstraints: false,
	})
	threadMessage: ThreadMessageEntity;

	@Column({ name: ColumnName.Channel.id, nullable: true })
	channelId: string;

	@Column({ name: ColumnName.CodeBlock.language, type: "varchar", length: 50 })
	language: string;

	@Column({ name: ColumnName.CodeBlock.content, type: "text" })
	content: string;

	@CreateDateColumn({ type: "datetime", name: ColumnName.Audit.createdAt })
	createdAt: Date;

	@UpdateDateColumn({ type: "datetime", name: ColumnName.Audit.updatedAt })
	updatedAt: Date;

	@DeleteDateColumn({
		type: "datetime",
		name: ColumnName.Audit.deletedAt,
		nullable: true,
	})
	deletedAt: Date | null;
}
