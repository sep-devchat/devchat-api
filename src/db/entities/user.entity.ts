import { DbConstants } from "@db/db-constants";
import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
	ValueTransformer,
} from "typeorm";
import { UserGroupEntity } from "./user-group.entity";
import { UserLanguageCollectionEntity } from "./user-language-collection.entity";
import { TransactionEntity } from "./transaction.entity";

const { TableName, ColumnName, IndexName } = DbConstants;

const stringArrayTransformer: ValueTransformer = {
	to: (value: unknown) => {
		if (value == null) return null;
		if (Array.isArray(value)) return JSON.stringify(value.map(String));
		if (typeof value === "string") {
			const trimmed = value.trim();
			if (!trimmed) return null;
			// If caller already provides a JSON array string, store as-is.
			if (trimmed.startsWith("[") && trimmed.endsWith("]")) return trimmed;
			return JSON.stringify([trimmed]);
		}
		return JSON.stringify([String(value)]);
	},
	from: (value: unknown) => {
		if (value == null) return null;
		if (Array.isArray(value)) return value.map(String);
		if (typeof value !== "string") return [String(value)];
		const trimmed = value.trim();
		if (!trimmed) return null;
		try {
			if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
				const parsed = JSON.parse(trimmed);
				return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
			}
		} catch {
			// fall through
		}
		// Back-compat: comma-separated or single string.
		if (trimmed.includes(",")) {
			const parts = trimmed
				.split(",")
				.map((p) => p.trim())
				.filter(Boolean);
			return parts.length ? parts : null;
		}
		return [trimmed];
	},
};

@Entity(TableName.User)
export class UserEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.User.id })
	id: string;

	@Column({ name: ColumnName.User.username, length: 50 })
	@Index(IndexName.User.username, { unique: true })
	username: string;

	@Column({ name: ColumnName.User.email, length: 255 })
	@Index(IndexName.User.email, { unique: true })
	email: string;

	@Column({ name: ColumnName.User.password, length: 255 })
	password: string;

	@Column({ name: ColumnName.User.firstName, length: 100 })
	firstName: string;

	@Column({ name: ColumnName.User.lastName, length: 100 })
	lastName: string;

	@Column({ name: ColumnName.User.avatarUrl, type: "text", nullable: true })
	avatarUrl: string | null;

	@Column({ name: ColumnName.User.isActive, type: "boolean", default: true })
	isActive: boolean;

	@Column({
		name: ColumnName.User.emailVerified,
		type: "boolean",
		default: false,
	})
	emailVerified: boolean;

	@Column({
		name: ColumnName.User.emailVerificationToken,
		type: "text",
		nullable: true,
	})
	emailVerificationToken: string | null;

	@Column({
		name: ColumnName.User.emailVerifiedAt,
		type: "timestamp",
		nullable: true,
	})
	emailVerifiedAt: Date | null;

	@CreateDateColumn({ name: ColumnName.User.createdAt })
	createdAt: Date;

	@UpdateDateColumn({ name: ColumnName.User.updatedAt })
	updatedAt: Date;

	@Column({ name: ColumnName.User.lastLogin, nullable: true, default: null })
	lastLogin: Date | null;

	@Column({ name: ColumnName.User.timezone, length: 50, nullable: true })
	timezone: string | null;

	@Column({ name: ColumnName.User.isAdmin, type: "boolean", default: false })
	isAdmin: boolean;

	@Column({ name: ColumnName.User.isBot, type: "boolean", default: false })
	isBot: boolean;

	@Column({
		name: ColumnName.User.subscriptionRole,
		type: "text",
		nullable: true,
		transformer: stringArrayTransformer,
	})
	subscriptionRole: string[] | null;

	@OneToMany(() => UserGroupEntity, (userGroup) => userGroup.user, {
		createForeignKeyConstraints: false,
	})
	userGroups: UserGroupEntity[];

	@OneToMany(
		() => UserLanguageCollectionEntity,
		(userLanguageCollection) => userLanguageCollection.user,
		{ cascade: true, createForeignKeyConstraints: false },
	)
	userLanguages: UserLanguageCollectionEntity[];

	@OneToMany(() => TransactionEntity, (transaction) => transaction.user, {
		createForeignKeyConstraints: false,
	})
	transactions: TransactionEntity[];
}
