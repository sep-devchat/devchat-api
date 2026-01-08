import { DbConstants } from "@db/db-constants";
import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { GroupEntity } from "./group.entity";
import { SubscriptionEntity } from "./subscription.entity";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.GroupSubscription)
export class GroupSubscriptionEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.GroupSubscription.id })
	id: string;

	@Column({ name: ColumnName.GroupSubscription.groupId })
	@Index(IndexName.GroupSubscription.groupId)
	groupId: string;

	@ManyToOne(() => GroupEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.GroupSubscription.groupId })
	group: GroupEntity;

	@Column({ name: ColumnName.GroupSubscription.subscriptionId })
	@Index(IndexName.GroupSubscription.subscriptionId)
	subscriptionId: string;

	@ManyToOne(
		() => SubscriptionEntity,
		(subscription) => subscription.groupSubscriptions,
		{ createForeignKeyConstraints: false },
	)
	@JoinColumn({ name: ColumnName.Subscription.id })
	subscription: SubscriptionEntity;

	@Column({
		name: ColumnName.GroupSubscription.groupSubscriptionStatus,
		length: 50,
		default: "active",
	})
	groupSubscriptionStatus: string;

	@Column({
		name: ColumnName.GroupSubscription.monthQuantity,
		type: "int",
		default: 1,
	})
	monthQuantity: number;

	@Column({
		name: ColumnName.GroupSubscription.remainDays,
		type: "int",
		default: 0,
	})
	remainDays: number;

	@Column({
		name: ColumnName.GroupSubscription.paymentBy,
		length: 50,
		nullable: true,
	})
	paymentBy: string | null;

	@Column({
		name: ColumnName.GroupSubscription.isPaid,
		type: "boolean",
		default: false,
	})
	isPaid: boolean;

	@Column({
		name: ColumnName.GroupSubscription.startedAt,
		type: "timestamp",
		nullable: true,
		default: null,
	})
	startedAt: Date | null;

	@Column({
		name: ColumnName.GroupSubscription.endedAt,
		type: "timestamp",
		nullable: true,
		default: null,
	})
	endedAt: Date | null;
}
