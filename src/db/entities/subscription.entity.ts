import { DbConstants } from "@db/db-constants";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
const { TableName, ColumnName } = DbConstants;

@Entity(TableName.Subscription)
export class SubscriptionEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.Subscription.id })
	id: string;

	@Column({
		name: ColumnName.Subscription.subscriptionCode,
		length: 50,
	})
	subscriptionCode: string;

	@Column({
		name: ColumnName.Subscription.subcriptionName,
		length: 100,
	})
	subscriptionName: string;

	@Column({
		name: ColumnName.Subscription.price,
		type: "decimal",
		precision: 12,
		scale: 2,
	})
	price: string;

	@Column({
		name: ColumnName.Subscription.limitMembers,
		type: "int",
		default: 0,
	})
	limitMembers: number;

	@Column({
		name: ColumnName.Subscription.isAIActive,
		type: "boolean",
		default: false,
	})
	isAIActive: boolean;

	@Column({
		name: ColumnName.Subscription.runCodePerDay,
		type: "int",
		default: 0,
	})
	runCodePerDay: number;

	@Column({
		name: ColumnName.Subscription.programmingLanguageInGroups,
		type: "int",
		default: 0,
	})
	programmingLanguageInGroups: number;

	@Column({
		name: ColumnName.Subscription.levelSubscription,
		length: 50,
	})
	levelSubscription: string;
}
