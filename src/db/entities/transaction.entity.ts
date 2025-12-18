import { DbConstants } from "@db/db-constants";
import {
	Column,
	Entity,
	Index,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { GroupSubscriptionEntity } from "./group-subscription.entity";
import { ShareFundEntity } from "./share-fund.entity";

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

	@ManyToOne(() => UserEntity, { createForeignKeyConstraints: false })
	user: UserEntity;

	@Column({
		name: ColumnName.Transaction.groupSubscriptionId,
		nullable: true,
	})
	@Index(IndexName.Transaction.groupSubscriptionId)
	groupSubscriptionId: string | null;

	@ManyToOne(() => GroupSubscriptionEntity, {
		createForeignKeyConstraints: false,
	})
	groupSubscription: GroupSubscriptionEntity;

	@Column({
		name: ColumnName.Transaction.shareFundId,
		nullable: true,
	})
	@Index(IndexName.Transaction.shareFundId)
	shareFundId: string | null;

	@ManyToOne(() => ShareFundEntity, { createForeignKeyConstraints: false })
	shareFund: ShareFundEntity;
}
