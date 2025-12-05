import { DbConstants } from "@db/db-constants";
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { CodeBlockEntity } from "./code-block.entity";

const { ColumnName, IndexName, TableName } = DbConstants;

@Entity(TableName.CodeCollaboration)
export class CodeCollaborationEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.CodeCollaboration.id })
	id: string;

	@Column({ name: ColumnName.CodeBlock.id })
	codeBlockId: string;

	@ManyToOne(() => CodeBlockEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.CodeBlock.id })
	codeBlock: CodeBlockEntity;

	@Column({ name: ColumnName.CodeCollaboration.content, type: "text" })
	content: string;

	@Column({ name: ColumnName.Audit.createdBy })
	createdById: string;

	@ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.Audit.createdBy })
	createdBy: UserEntity;

	@CreateDateColumn({ name: ColumnName.Audit.createdAt })
	createdAt: Date;

	@UpdateDateColumn({ name: ColumnName.Audit.updatedAt })
	updatedAt: Date;
}
