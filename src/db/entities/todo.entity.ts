import { DbConstants } from "@db/db-constants";
import { TodoPriorityEnum, TodoStatusEnum } from "@utils";
import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.Todo)
export class TodoEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.Todo.id })
	id: string;

	@Column({ name: ColumnName.User.id })
	@Index(IndexName.Todo.userId)
	userId: string;

	@Column({ name: ColumnName.Todo.name, length: 255 })
	name: string;

	@Column({ name: ColumnName.Todo.description, type: "text", nullable: true })
	description: string | null;

	@Column({
		name: ColumnName.Todo.priority,
		type: "int",
		default: TodoPriorityEnum.MEDIUM,
	})
	priority: number;

	@Column({
		name: ColumnName.Todo.status,
		type: "int",
		default: TodoStatusEnum.TODO,
	})
	status: number;

	@Column({ name: ColumnName.Todo.dueDate, type: "datetime", nullable: true })
	dueDate: Date | null;

	@Column({ name: ColumnName.Audit.isActive, type: "boolean", default: true })
	isActive: boolean;

	@Column({
		name: ColumnName.Audit.createdAt,
		type: "datetime",
		default: () => "CURRENT_TIMESTAMP",
	})
	createdAt: Date;

	@Column({
		name: ColumnName.Audit.updatedAt,
		type: "datetime",
		default: () => "CURRENT_TIMESTAMP",
	})
	updatedAt: Date;
}
