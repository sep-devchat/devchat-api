import { DbConstants } from "@db/db-constants";
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { ChannelEntity } from "./channel.entity";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.Thread)
export class ThreadEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.Thread.id })
	id: string;

	@Column({ name: ColumnName.Thread.name })
	name: string;

	@Column({ name: ColumnName.Channel.id })
	channelId: string;

	@ManyToOne(() => ChannelEntity)
	@JoinColumn({ name: ColumnName.Channel.id })
	channel: ChannelEntity;

	@Column({ name: ColumnName.Thread.description })
	description: string;

	@Column({ name: ColumnName.Audit.createdBy })
	createdBy: string;

	@CreateDateColumn({ name: ColumnName.Audit.createdAt })
	createdAt: Date;
}
