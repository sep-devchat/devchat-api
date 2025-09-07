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

@Entity(TableName.User)
export class UserEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.User.id })
	id: string;

	@Column({ name: ColumnName.User.username, length: 50 })
	@Index(IndexName.User.username, { unique: true })
	username: string;

	@Column({ name: ColumnName.User.email, length: 255 })
	@Index(IndexName.User.email, { unique: true })
	email: string;

	@Column({ name: ColumnName.User.password, length: 255 })
	password: string;

	@Column({ name: ColumnName.User.firstName, length: 100 })
	firstName: string;

	@Column({ name: ColumnName.User.lastName, length: 100 })
	lastName: string;

	@Column({ name: ColumnName.User.avatarUrl, type: "text", nullable: true })
	avatarUrl: string | null;

	@Column({ name: ColumnName.User.isActive, type: "boolean", default: true })
	isActive: boolean;

	@Column({
		name: ColumnName.User.emailVerified,
		type: "boolean",
		default: false,
	})
	emailVerified: boolean;

	@CreateDateColumn({ name: ColumnName.User.createdAt })
	createdAt: Date;

	@UpdateDateColumn({ name: ColumnName.User.updatedAt })
	updatedAt: Date;

	@Column({ name: ColumnName.User.lastLogin, nullable: true, default: null })
	lastLogin: Date | null;

	@Column({ name: ColumnName.User.timezone, length: 50, nullable: true })
	timezone: string | null;
}
