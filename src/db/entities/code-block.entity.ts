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
import { CodeExecutionStatus } from "@utils";
import { MessageEntity } from "./message.entity";

const { TableName, ColumnName } = DbConstants;

@Entity(TableName.CodeBlock)
export class CodeBlockEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.CodeBlock.id })
	id: string;

	@Column({ name: ColumnName.CodeBlock.userId, type: "uuid" })
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({ name: ColumnName.CodeBlock.userId })
	user: UserEntity;

	@OneToOne(() => MessageEntity, (message) => message.codeBlock, {
		onDelete: "CASCADE",
	})
	message: MessageEntity;

	@Column({ name: ColumnName.Attachment.channelId, nullable: true })
	channelId: string;

	@Column({
		name: ColumnName.CodeBlock.title,
		type: "varchar",
		length: 255,
		nullable: true,
	})
	title: string | null;

	@Column({
		name: ColumnName.CodeBlock.description,
		type: "text",
		nullable: true,
	})
	description: string | null;

	@Column({ name: ColumnName.CodeBlock.language, type: "varchar", length: 50 })
	language: string;

	@Column({ name: ColumnName.CodeBlock.code, type: "text" })
	content: string;

	@Column({
		name: ColumnName.CodeBlock.executionResult,
		type: "text",
		nullable: true,
	})
	executionResult: string | null;

	@Column({
		name: ColumnName.CodeBlock.executionStatus,
		type: "int",
		default: CodeExecutionStatus.PENDING,
	})
	executionStatus: number;

	@Column({
		name: ColumnName.CodeBlock.executedAt,
		type: "datetime",
		nullable: true,
	})
	executedAt: Date | null;

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
