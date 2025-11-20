import { DbConstants } from "@db/db-constants";
import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
} from "typeorm";

const { TableName, ColumnName } = DbConstants;

@Entity(TableName.Thread)
export class ThreadEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.Thread.id })
	id: string;

	@Column({ name: ColumnName.Thread.name })
	name: string;

	@Column({ name: ColumnName.Message.id })
	messageId: string;

	@Column({ name: ColumnName.Channel.id })
	channelId: string;

	@Column({ name: ColumnName.Audit.createdBy })
	createdById: string;

	@CreateDateColumn({ name: ColumnName.Audit.createdAt })
	createdAt: Date;
}
