import { DbConstants } from "@db/db-constants";
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	Index,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.AuditLog)
export class AuditLogEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.AuditLog.id })
	id: string;

	// Actor performing the action
	@Index(IndexName.AuditLog.userId)
	@Column({ name: ColumnName.AuditLog.userId, type: "uuid" })
	userId: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({ name: ColumnName.AuditLog.userId })
	user?: UserEntity | null;

	// High-level action verb e.g. CREATE_ROLE, UPDATE_PERMISSION
	@Column({ name: ColumnName.AuditLog.action, length: 100 })
	action: string;

	// Technical entity type (e.g. AdminRole, Permission, User)
	@Index(IndexName.AuditLog.entityType)
	@Column({ name: ColumnName.AuditLog.entityType, length: 100 })
	entityType: string;

	// Before state (only include changed fields to reduce size) - optional
	@Column({ name: ColumnName.AuditLog.oldValues, type: "json", nullable: true })
	oldValues: Record<string, any> | null;

	// After state (only include changed fields) - optional
	@Column({ name: ColumnName.AuditLog.newValues, type: "json", nullable: true })
	newValues: Record<string, any> | null;

	// Timestamp of the log entry creation
	@CreateDateColumn({ name: ColumnName.Audit.createdAt })
	createdAt: Date;

	@Column({ name: ColumnName.Audit.createdBy })
	createdBy: string;
}
