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
import { CodeBlockEntity } from "./code-block.entity";

const { TableName, ColumnName } = DbConstants;

@Entity(TableName.DirectMessage)
export class DirectMessageEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.DirectMessage.id })
	id: string;

	@Column({ name: ColumnName.DirectMessage.fromUserId })
	fromUserId: string;

	@ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.DirectMessage.fromUserId })
	fromUser: UserEntity;

	@Column({ name: ColumnName.DirectMessage.toUserId })
	toUserId: string;

	@ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.DirectMessage.toUserId })
	toUser: UserEntity;

	@Column({ name: ColumnName.DirectMessage.parentMessageId, nullable: true })
	parentMessageId: string | null;

	@ManyToOne(() => DirectMessageEntity, {
		nullable: true,
		createForeignKeyConstraints: false,
	})
	@JoinColumn({ name: ColumnName.DirectMessage.parentMessageId })
	parentMessage: DirectMessageEntity | null;

	@Column({ name: ColumnName.DirectMessage.content, type: "text" })
	content: string;

	@Column({ name: ColumnName.CodeBlock.id, type: "uuid", nullable: true })
	codeBlockId: string;

	@OneToOne(() => CodeBlockEntity, {
		cascade: true,
		nullable: true,
		createForeignKeyConstraints: false,
	})
	@JoinColumn({ name: ColumnName.CodeBlock.id })
	codeBlock: CodeBlockEntity;

	@CreateDateColumn({ name: ColumnName.Audit.createdAt })
	createdAt: Date;

	@CreateDateColumn({ name: ColumnName.Audit.updatedAt })
	updatedAt: Date;
}
