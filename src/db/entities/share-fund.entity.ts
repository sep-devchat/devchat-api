import { DbConstants } from "@db/db-constants";
import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { GroupEntity } from "./group.entity";
import { SubscriptionEntity } from "./subscription.entity";
import { TransactionEntity } from "./transaction.entity";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.ShareFund)
export class ShareFundEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.ShareFund.id })
	id: string;

	@Column({ name: ColumnName.ShareFund.groupId, type: "uuid" })
	@Index(IndexName.ShareFund.groupId)
	groupId: string;

	@ManyToOne(() => GroupEntity, { createForeignKeyConstraints: false })
	group: GroupEntity;

	@Column({ name: ColumnName.ShareFund.subscriptionId, type: "uuid" })
	@Index(IndexName.ShareFund.subscriptionId)
	subscriptionId: string;

	@ManyToOne(() => SubscriptionEntity, { createForeignKeyConstraints: false })
	subscription: SubscriptionEntity;

	@Column({
		name: ColumnName.ShareFund.monthQuantity,
		type: "int",
		default: 1,
	})
	monthQuantity: number;

	@Column({
		name: ColumnName.ShareFund.fundName,
		type: "varchar",
		length: 150,
		nullable: true,
	})
	fundName: string | null;

	@Column({
		name: ColumnName.ShareFund.contributeTime,
		type: "int",
		nullable: true,
	})
	contributeTime: number | null;

	@Column({
		name: ColumnName.ShareFund.currentVndAmount,
		type: "decimal",
		precision: 15,
		scale: 0,
		default: "0",
	})
	currentVndAmount: string;

	@CreateDateColumn({ name: ColumnName.ShareFund.createdAt })
	createdAt: Date;

	@UpdateDateColumn({ name: ColumnName.ShareFund.updatedAt })
	updatedAt: Date;

	@OneToMany(() => TransactionEntity, (tx) => tx.shareFund, {
		createForeignKeyConstraints: false,
	})
	transactions: TransactionEntity[];
}
