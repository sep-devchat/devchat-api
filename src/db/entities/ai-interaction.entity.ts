import { DbConstants } from "@db/db-constants";
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	Index,
	CreateDateColumn,
	UpdateDateColumn,
} from "typeorm";
import { AiSessionEntity } from "./ai-session.entity";
import { MessageEntity } from "./message.entity";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.AiInteraction)
export class AiInteractionEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.AiInteraction.id })
	id: string;

	@Index(IndexName.AiInteraction.sessionId)
	@Column({ name: ColumnName.AiInteraction.sessionId, type: "uuid" })
	sessionId: string;

	@ManyToOne(() => AiSessionEntity, { nullable: false, onDelete: "CASCADE" })
	@JoinColumn({ name: ColumnName.AiInteraction.sessionId })
	session: AiSessionEntity;

	@Index(IndexName.AiInteraction.messageId)
	@Column({
		name: ColumnName.AiInteraction.messageId,
		type: "uuid",
		nullable: true,
	})
	messageId: string | null;

	@ManyToOne(() => MessageEntity, { nullable: true })
	@JoinColumn({ name: ColumnName.AiInteraction.messageId })
	message?: MessageEntity | null;

	@Column({
		name: ColumnName.AiInteraction.aiResponse,
		type: "text",
		nullable: true,
	})
	aiResponse: string | null;

	@Column({
		name: ColumnName.AiInteraction.model,
		type: "varchar",
		length: 100,
		nullable: true,
	})
	model: string | null;

	@Column({
		name: ColumnName.AiInteraction.contextData,
		type: "json",
		nullable: true,
	})
	contextData: Record<string, any> | null;

	@Column({
		name: ColumnName.AiInteraction.responseTime,
		type: "int",
		nullable: true,
	})
	responseTime: number | null; // milliseconds

	// Audit columns
	@CreateDateColumn({ name: ColumnName.Audit.createdAt })
	createdAt: Date;

	@UpdateDateColumn({ name: ColumnName.Audit.updatedAt })
	updatedAt: Date;

	@Column({
		name: ColumnName.Audit.deletedAt,
		type: "datetime",
		nullable: true,
	})
	deletedAt: Date | null;

	@Column({ name: ColumnName.Audit.createdBy })
	createdBy: string;

	@Column({ name: ColumnName.Audit.updatedBy, nullable: true })
	updatedBy: string | null;

	@Column({ name: ColumnName.Audit.deletedBy, nullable: true })
	deletedBy: string | null;

	@Column({ name: ColumnName.Audit.isActive, type: "boolean", default: true })
	isActive: boolean;
}
