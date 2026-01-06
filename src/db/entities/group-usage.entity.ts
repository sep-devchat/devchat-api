import { DbConstants } from "@db/db-constants";
import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { GroupEntity } from "./group.entity";

const { TableName, ColumnName, IndexName } = DbConstants;

/**
 * Usage counters for a group for a given billing cycle.
 * The cycle key is an app-defined string like "2026-01".
 */
@Entity(TableName.GroupUsage)
@Index(
	IndexName.GroupUsage.groupIdAndBillingCycleKey,
	["groupId", "billingCycleKey"],
	{
		unique: true,
	},
)
export class GroupUsageEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.GroupUsage.id })
	id: string;

	@Index(IndexName.GroupUsage.groupId)
	@Column({ name: ColumnName.GroupUsage.groupId, type: "uuid" })
	groupId: string;

	@ManyToOne(() => GroupEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.GroupUsage.groupId })
	group: GroupEntity;

	@Column({
		name: ColumnName.GroupUsage.billingCycleKey,
		type: "varchar",
		length: 20,
	})
	billingCycleKey: string;

	@Column({ name: ColumnName.GroupUsage.periodStart, type: "timestamp" })
	periodStart: Date;

	@Column({ name: ColumnName.GroupUsage.periodEnd, type: "timestamp" })
	periodEnd: Date;

	@Column({ name: ColumnName.GroupUsage.messagesSent, type: "int", default: 0 })
	messagesSent: number;

	@Column({
		name: ColumnName.GroupUsage.fileBytesUploaded,
		type: "bigint",
		default: 0,
	})
	fileBytesUploaded: string;

	@Column({
		name: ColumnName.GroupUsage.runCodeExecutions,
		type: "int",
		default: 0,
	})
	runCodeExecutions: number;

	@Column({
		name: ColumnName.GroupUsage.aiTokensConsumed,
		type: "bigint",
		default: 0,
	})
	aiTokensConsumed: string;

	@CreateDateColumn({
		name: ColumnName.GroupUsage.createdAt,
		type: "timestamp",
	})
	createdAt: Date;

	@UpdateDateColumn({
		name: ColumnName.GroupUsage.updatedAt,
		type: "timestamp",
	})
	updatedAt: Date;
}
