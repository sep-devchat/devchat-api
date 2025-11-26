import { DbConstants } from "@db/db-constants";
import { TaskPriorityEnum, TaskStatusEnum } from "@utils";
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { GroupEntity } from "./group.entity";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.Task)
export class TaskEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.Task.id })
	id: string;

	@Column({
		name: ColumnName.Task.assigneeId,
		type: "uuid",
		nullable: true,
	})
	assigneeId: string | null;

	@Column({
		name: ColumnName.Group.id,
		type: "uuid",
	})
	groupId: string;

	@Column({
		name: ColumnName.Audit.createdBy,
		type: "uuid",
	})
	createdBy: string;

	@Column({
		name: ColumnName.Task.name,
		length: 255,
	})
	name: string;

	@Column({
		name: ColumnName.Task.description,
		type: "text",
		nullable: true,
	})
	description: string | null;

	@Column({
		name: ColumnName.Task.status,
		type: "int",
		default: TaskStatusEnum.TODO,
	})
	status: number;

	@Column({
		name: ColumnName.Task.priority,
		type: "int",
		default: TaskPriorityEnum.MEDIUM,
	})
	priority: number;

	@ManyToOne(() => UserEntity)
	@JoinColumn({
		name: ColumnName.Task.assigneeId,
	})
	assignee: UserEntity | null;

	@ManyToOne(() => UserEntity)
	@JoinColumn({
		name: ColumnName.Audit.createdBy,
	})
	creator: UserEntity;

	@ManyToOne(() => GroupEntity)
	@JoinColumn({
		name: ColumnName.Group.id,
	})
	group: GroupEntity;

	@Column({
		name: ColumnName.Task.startDate,
		type: "timestamp",
		nullable: true,
	})
	startDate: Date | null;

	@Column({
		name: ColumnName.Task.dueDate,
		type: "timestamp",
		nullable: true,
	})
	dueDate: Date | null;

	@Column({
		name: ColumnName.Audit.createdAt,
		type: "timestamp",
		default: () => "CURRENT_TIMESTAMP",
	})
	createdAt: Date;

	@Column({
		name: ColumnName.Audit.updatedAt,
		type: "timestamp",
		default: () => "CURRENT_TIMESTAMP",
		onUpdate: "CURRENT_TIMESTAMP",
	})
	updatedAt: Date;

	@Column({
		name: ColumnName.Audit.isActive,
		type: "boolean",
		default: true,
	})
	isActive: boolean;
}
