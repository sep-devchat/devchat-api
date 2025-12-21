import { DbConstants } from "@db/db-constants";
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { TaskEntity } from "./task.entity";

const { TableName, ColumnName } = DbConstants;

@Entity(TableName.TaskHistory)
export class TaskHistoryEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.TaskHistory.id })
	id: string;

	@Column({
		name: ColumnName.TaskHistory.taskId,
		type: "uuid",
	})
	taskId: string;

	@Column({
		name: ColumnName.TaskHistory.userId,
		type: "uuid",
	})
	userId: string;

	@Column({
		name: ColumnName.TaskHistory.action,
		length: 100,
	})
	action: string;

	@Column({
		name: ColumnName.TaskHistory.fieldName,
		length: 100,
		nullable: true,
	})
	fieldName: string | null;

	@Column({
		name: ColumnName.TaskHistory.oldValue,
		type: "text",
		nullable: true,
	})
	oldValue: string | null;

	@Column({
		name: ColumnName.TaskHistory.newValue,
		type: "text",
		nullable: true,
	})
	newValue: string | null;

	@Column({
		name: ColumnName.Audit.createdAt,
		type: "timestamp",
	})
	createdAt: Date;

	@ManyToOne(() => TaskEntity, { createForeignKeyConstraints: false })
	@JoinColumn({
		name: ColumnName.TaskHistory.taskId,
	})
	task: TaskEntity;

	@ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
	@JoinColumn({
		name: ColumnName.TaskHistory.userId,
	})
	user: UserEntity;
}
