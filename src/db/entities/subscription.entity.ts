import { DbConstants } from "@db/db-constants";
import {
	Column,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	ValueTransformer,
} from "typeorm";
import { ShareFundEntity } from "./share-fund.entity";
import { GroupSubscriptionEntity } from "./group-subscription.entity";
const { TableName, ColumnName } = DbConstants;

const numberFromUnknown = (value: unknown): number => {
	if (value == null) return 0;
	if (typeof value === "number") return Number.isFinite(value) ? value : 0;
	const str = String(value);
	const digits = str.match(/\d+(?:\.\d+)?/)?.[0];
	const n = Number(digits ?? str);
	return Number.isFinite(n) ? n : 0;
};

const numberTransformer: ValueTransformer = {
	to: (value: unknown) => value,
	from: (value: unknown) => numberFromUnknown(value),
};

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
		transformer: numberTransformer,
	})
	price: number;

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
		type: "varchar",
		length: 50,
		transformer: numberTransformer,
	})
	levelSubscription: number;

	@OneToMany(() => ShareFundEntity, (shareFund) => shareFund.subscription, {
		createForeignKeyConstraints: false,
	})
	shareFunds: ShareFundEntity[];

	@OneToMany(
		() => GroupSubscriptionEntity,
		(groupSubscription) => groupSubscription.subscription,
		{ createForeignKeyConstraints: false },
	)
	groupSubscriptions: GroupSubscriptionEntity[];
}
