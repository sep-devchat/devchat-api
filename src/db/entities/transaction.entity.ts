import { DbConstants } from "@db/db-constants";
import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { GroupEntity } from "./group.entity";
import { ShareFundEntity } from "./share-fund.entity";
import { SubscriptionEntity } from "./subscription.entity";
import { OrderEntity } from "./order.entity";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.Transaction)
export class TransactionEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.Transaction.id })
	id: string;

	@Column({
		name: ColumnName.Transaction.vndAmount,
		type: "decimal",
		precision: 15,
		scale: 0,
	})
	vndAmount: string;

	@Column({
		name: ColumnName.Transaction.transactionMessage,
		type: "text",
		nullable: true,
	})
	transactionMessage: string | null;

	@Column({ name: ColumnName.Transaction.paymentMethod, length: 50 })
	paymentMethod: string;

	@Column({ name: ColumnName.Transaction.transactionStatus, length: 50 })
	transactionStatus: string;

	@Column({ name: ColumnName.Transaction.transactionType, length: 50 })
	transactionType: string;

	@Column({ name: ColumnName.Transaction.transactionCode, length: 100 })
	transactionCode: string;

	@Column({ name: ColumnName.Transaction.userId })
	@Index(IndexName.Transaction.userId)
	userId: string;

	@ManyToOne(() => UserEntity, (user) => user.transactions, {
		createForeignKeyConstraints: false,
	})
	@JoinColumn({ name: ColumnName.Transaction.userId })
	user: UserEntity;

	@Column({ name: ColumnName.Transaction.groupId, nullable: true })
	@Index(IndexName.Transaction.groupId)
	groupId: string | null;

	@ManyToOne(() => GroupEntity, (group) => group.transactions, {
		createForeignKeyConstraints: false,
	})
	@JoinColumn({ name: ColumnName.Transaction.groupId })
	group: GroupEntity;

	@Column({
		name: ColumnName.Transaction.shareFundId,
		nullable: true,
	})
	@Index(IndexName.Transaction.shareFundId)
	shareFundId: string | null;

	@ManyToOne(() => ShareFundEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.Transaction.shareFundId })
	shareFund: ShareFundEntity;

	@Column({ name: ColumnName.Transaction.subscriptionId, nullable: true })
	subscriptionId: string | null;

	@ManyToOne(() => SubscriptionEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.Transaction.subscriptionId })
	subscription: SubscriptionEntity;

	@Column({ name: ColumnName.Transaction.orderId, nullable: true })
	orderId: string | null;

	@ManyToOne(() => OrderEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.Transaction.orderId })
	order: OrderEntity;

	@Column({
		name: ColumnName.Audit.createdAt,
		type: "timestamp",
		default: () => "CURRENT_TIMESTAMP",
	})
	createdAt: Date;
}
