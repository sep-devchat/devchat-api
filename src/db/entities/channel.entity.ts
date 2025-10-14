import { DbConstants } from "@db/db-constants";
import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { GroupEntity } from "./group.entity";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.Channel)
export class ChannelEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.Channel.id })
	id: string;

	@Column({ name: ColumnName.Channel.name })
	@Index(IndexName.Channel.name)
	name: string;

	@Column({ name: ColumnName.Group.id })
	@Index(IndexName.Channel.groupId)
	groupId: string;

	@ManyToOne(() => GroupEntity)
	@JoinColumn({ name: ColumnName.Group.id })
	group: GroupEntity;

	@Column({ name: ColumnName.Channel.description, nullable: true })
	description: string | null;

	@Column({ name: ColumnName.Audit.createdBy })
	createdBy: string;

	@CreateDateColumn({ name: ColumnName.Audit.createdAt })
	createdAt: Date;
}
