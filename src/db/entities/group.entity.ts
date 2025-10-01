import { DbConstants } from "@db/db-constants";
import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.Group)
export class GroupEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.Group.id })
	id: string;

	@Column({ name: ColumnName.Group.name, length: 200 })
	@Index(IndexName.Group.name)
	name: string;

	@Column({ name: ColumnName.Group.description, type: "text", nullable: true })
	description: string | null;

	@Column({ name: ColumnName.Group.avatar, nullable: true })
	avatar: string | null;

	@Column({ name: ColumnName.Group.createdBy, type: "uuid" })
	createdBy: string;

	@CreateDateColumn({ name: ColumnName.Group.createdAt })
	createdAt: Date;

	@UpdateDateColumn({ name: ColumnName.Group.updatedAt })
	updatedAt: Date;

	@Column({ name: ColumnName.Group.isActive, type: "boolean", default: true })
	isActive: boolean;
}
