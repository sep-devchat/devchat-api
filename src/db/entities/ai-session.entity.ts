import { DbConstants } from "@db/db-constants";
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	Index,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { ChannelEntity } from "./channel.entity";
import { ThreadEntity } from "./thread.entity";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.AiSession)
export class AiSessionEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.AiSession.id })
	id: string;

	@Index(IndexName.AiSession.userId)
	@Column({ name: ColumnName.AiSession.userId, type: "uuid" })
	userId: string;

	@ManyToOne(() => UserEntity, {
		nullable: false,
		createForeignKeyConstraints: false,
	})
	@JoinColumn({ name: ColumnName.AiSession.userId })
	user: UserEntity;

	@Index(IndexName.AiSession.channelId)
	@Column({
		name: ColumnName.AiSession.channelId,
		type: "uuid",
		nullable: true,
	})
	channelId: string | null;

	@ManyToOne(() => ChannelEntity, {
		nullable: true,
		createForeignKeyConstraints: false,
	})
	@JoinColumn({ name: ColumnName.AiSession.channelId })
	channel?: ChannelEntity | null;

	@Index(IndexName.AiSession.threadId)
	@Column({ name: ColumnName.AiSession.threadId, type: "uuid", nullable: true })
	threadId?: string | null;

	@ManyToOne(() => ThreadEntity, {
		nullable: true,
		createForeignKeyConstraints: false,
	})
	@JoinColumn({ name: ColumnName.AiSession.threadId })
	thread?: ThreadEntity | null;

	@Column({ name: ColumnName.AiSession.sessionType, length: 50 })
	sessionType: string;

	@Column({ name: ColumnName.AiSession.startedAt, type: "timestamp" })
	startedAt: Date;

	@Column({
		name: ColumnName.AiSession.endedAt,
		type: "timestamp",
		nullable: true,
	})
	endedAt: Date | null;

	@Index(IndexName.AiSession.status)
	@Column({ name: ColumnName.AiSession.status, length: 50, nullable: true })
	status: string | null;
}
