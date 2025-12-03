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
import { CodeBlockEntity } from "./code-block.entity";
import { UserEntity } from "./user.entity";

const { ColumnName, TableName } = DbConstants;

@Entity(TableName.ThreadMessage)
export class ThreadMessageEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.ThreadMessage.id })
	id: string;

	@Column({ name: ColumnName.ThreadMessage.content, type: "text" })
	content: string;

	@Column({ name: ColumnName.ThreadMessage.parentMessageId, nullable: true })
	parentMessageId: string | null;

	@ManyToOne(() => ThreadMessageEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.ThreadMessage.parentMessageId })
	parentMessage: ThreadMessageEntity | null;

	@Column({ name: ColumnName.ThreadMessage.senderId })
	senderId: string;

	@ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.ThreadMessage.senderId })
	sender: UserEntity;

	@Column({ name: ColumnName.Thread.id })
	threadId: string;

	@Column({ name: ColumnName.Channel.id })
	channelId: string;

	@Column({ name: ColumnName.CodeBlock.id, nullable: true })
	codeBlockId: string | null;

	@OneToOne(() => CodeBlockEntity, (codeBlock) => codeBlock.threadMessage, {
		cascade: true,
		nullable: true,
		createForeignKeyConstraints: false,
	})
	@JoinColumn({ name: ColumnName.CodeBlock.id })
	codeBlock: CodeBlockEntity | null;

	@CreateDateColumn({ name: ColumnName.Audit.createdAt })
	createdAt: Date;

	@UpdateDateColumn({ name: ColumnName.Audit.updatedAt })
	updatedAt: Date;
}
