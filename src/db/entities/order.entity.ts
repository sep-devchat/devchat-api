import { DbConstants } from "@db/db-constants";
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { GroupEntity } from "./group.entity";
import { SubscriptionEntity } from "./subscription.entity";
import { TransactionEntity } from "./transaction.entity";

const { TableName, ColumnName } = DbConstants;

@Entity(TableName.Order)
export class OrderEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.Order.id })
	id: string;

	@Column({ name: ColumnName.Order.orderCode })
	orderCode: string;

	@Column({ name: ColumnName.Order.orderStatus })
	orderStatus: string;

	@Column({ name: ColumnName.Order.groupId })
	groupId: string;

	@ManyToOne(() => GroupEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.Order.groupId })
	group: GroupEntity;

	@Column({ name: ColumnName.Order.subscriptionId })
	subscriptionId: string;

	@ManyToOne(() => SubscriptionEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: ColumnName.Order.subscriptionId })
	subscription: SubscriptionEntity;

	@Column({ name: ColumnName.Order.monthQuantity, type: "int" })
	monthQuantity: number;

	@Column({ name: ColumnName.Order.paymentBy, length: 50, nullable: true })
	paymentBy: string;

	@Column({
		name: ColumnName.Audit.createdAt,
		type: "timestamp",
		default: () => "CURRENT_TIMESTAMP",
	})
	createdAt: Date;

	@Column({
		name: ColumnName.Audit.createdBy,
		nullable: true,
		length: 50,
		default: null,
	})
	createdBy: string;

	@OneToMany(
		() => TransactionEntity,
		(orderTransaction) => orderTransaction.order,
	)
	@JoinColumn({ name: ColumnName.Order.id })
	orderTransactions: TransactionEntity[];
}
