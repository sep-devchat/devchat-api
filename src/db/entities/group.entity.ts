import { DbConstants } from "@db/db-constants";
import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { UserGroupEntity } from "./user-group.entity";
import { ShareFundEntity } from "./share-fund.entity";
import { GroupSubscriptionEntity } from "./group-subscription.entity";
import { TransactionEntity } from "./transaction.entity";
import { GroupSupportedProgrammingLanguageEntity } from "./group-supported-programming-language.entity";
import { GroupEntitlementEntity } from "./group-entitlement.entity";
import { GroupUsageEntity } from "./group-usage.entity";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.Group)
export class GroupEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.Group.id })
	id: string;

	@Column({ name: ColumnName.Group.name, length: 200 })
	@Index(IndexName.Group.name)
	name: string;

	@Column({ name: ColumnName.Group.description, type: "text", nullable: true })
	description: string | null;

	@Column({ name: ColumnName.Group.avatar, nullable: true })
	avatar: string | null;

	@Column({ name: ColumnName.Group.createdBy, type: "uuid" })
	createdBy: string;

	@CreateDateColumn({ name: ColumnName.Group.createdAt })
	createdAt: Date;

	@UpdateDateColumn({ name: ColumnName.Group.updatedAt })
	updatedAt: Date;

	@Column({ name: ColumnName.Group.isActive, type: "boolean", default: true })
	isActive: boolean;

	@OneToMany(() => UserGroupEntity, (userGroup) => userGroup.group, {
		createForeignKeyConstraints: false,
	})
	userGroups: UserGroupEntity[];

	@OneToMany(() => ShareFundEntity, (shareFund) => shareFund.group, {
		createForeignKeyConstraints: false,
	})
	shareFunds: ShareFundEntity[];

	@OneToMany(
		() => GroupSubscriptionEntity,
		(groupSubscription) => groupSubscription.group,
		{
			createForeignKeyConstraints: false,
		},
	)
	groupSubscriptions: GroupSubscriptionEntity[];

	@OneToMany(() => TransactionEntity, (transaction) => transaction.group, {
		createForeignKeyConstraints: false,
	})
	transactions: TransactionEntity[];

	@OneToMany(
		() => GroupSupportedProgrammingLanguageEntity,
		(groupLanguage) => groupLanguage.group,
		{ createForeignKeyConstraints: false },
	)
	groupSupportedProgrammingLanguages: GroupSupportedProgrammingLanguageEntity[];

	@OneToMany(
		() => GroupEntitlementEntity,
		(groupEntitlement) => groupEntitlement.group,
		{
			createForeignKeyConstraints: false,
		},
	)
	groupEntitlements: GroupEntitlementEntity[];

	@OneToMany(() => GroupUsageEntity, (groupUsage) => groupUsage.group, {
		createForeignKeyConstraints: false,
	})
	groupUsages: GroupUsageEntity[];
}
