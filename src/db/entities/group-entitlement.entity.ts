import { DbConstants } from "@db/db-constants";
import {
	BeforeUpdate,
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { GroupEntity } from "./group.entity";
import { SubscriptionEntity } from "./subscription.entity";

const { TableName, ColumnName, IndexName } = DbConstants;

export type GroupEntitlementSource =
	| "trial"
	| "purchase"
	| "renewal"
	| "change"
	| "admin_override"
	| "migration";

/**
 * Immutable group entitlement snapshot.
 *
 * Stores the entitlement JSON that group runtime should depend on.
 * Can optionally reference the legacy subscriptionId for audit/display.
 */
@Entity(TableName.GroupEntitlement)
export class GroupEntitlementEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.GroupEntitlement.id })
	id: string;

	@Index(IndexName.GroupEntitlement.groupId)
	@Column({ name: ColumnName.GroupEntitlement.groupId, type: "uuid" })
	groupId: string;

	@ManyToOne(() => GroupEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.GroupEntitlement.groupId })
	group: GroupEntity;

	@Index(IndexName.GroupEntitlement.groupIdAndEffectiveFrom)
	@Column({
		name: ColumnName.GroupEntitlement.effectiveFrom,
		type: "timestamp",
		update: false,
	})
	effectiveFrom: Date;

	@Column({
		name: ColumnName.GroupEntitlement.effectiveTo,
		type: "timestamp",
		nullable: true,
		default: null,
		update: false,
	})
	effectiveTo: Date | null;

	@Column({
		name: ColumnName.GroupEntitlement.source,
		type: "varchar",
		length: 30,
		default: "purchase",
		update: false,
	})
	source: GroupEntitlementSource;

	@Column({
		name: ColumnName.GroupEntitlement.subscriptionId,
		type: "uuid",
		nullable: true,
		default: null,
		update: false,
	})
	subscriptionId: string | null;

	@ManyToOne(() => SubscriptionEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.GroupEntitlement.subscriptionId })
	subscription: SubscriptionEntity;

	@Column({
		name: ColumnName.GroupEntitlement.entitlements,
		type: "json",
		update: false,
	})
	entitlements: Record<string, any>;

	@CreateDateColumn({
		name: ColumnName.GroupEntitlement.createdAt,
		type: "timestamp",
		update: false,
	})
	createdAt: Date;

	@Column({
		name: ColumnName.GroupEntitlement.createdBy,
		type: "varchar",
		length: 36,
		update: false,
	})
	createdBy: string;

	@BeforeUpdate()
	preventUpdate(): never {
		throw new Error("GroupEntitlement is immutable once created");
	}
}
