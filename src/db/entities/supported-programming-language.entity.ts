import { DbConstants } from "@db/db-constants";
import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { UserLanguageCollectionEntity } from "./user-language-collection.entity";

const { TableName, ColumnName } = DbConstants;

@Entity(TableName.SupportedProgrammingLanguage)
export class SupportedProgrammingLanguageEntity {
	@PrimaryGeneratedColumn("uuid", {
		name: ColumnName.SupportedProgrammingLanguage.id,
	})
	id: string;

	@Column({
		name: ColumnName.SupportedProgrammingLanguage.languageCode,
		length: 50,
	})
	languageCode: string;

	@Column({
		name: ColumnName.SupportedProgrammingLanguage.languageName,
		length: 100,
	})
	languageName: string;

	@Column({
		name: ColumnName.SupportedProgrammingLanguage.languageIcon,
		type: "text",
		nullable: true,
	})
	languageIcon: string | null;

	@Column({
		name: ColumnName.SupportedProgrammingLanguage.languageVersion,
		length: 50,
		nullable: true,
	})
	languageVersion: string | null;

	@Column({
		name: ColumnName.SupportedProgrammingLanguage.isExecutable,
		type: "boolean",
		default: false,
	})
	isExecutable: boolean;

	@Column({
		name: ColumnName.SupportedProgrammingLanguage.useAiCheck,
		type: "boolean",
		default: true,
	})
	useAiCheck: boolean;

	@Column({
		name: ColumnName.SupportedProgrammingLanguage.preset,
		type: "text",
		nullable: true,
	})
	preset: string | null;

	@CreateDateColumn({ name: ColumnName.Audit.createdAt })
	createdAt: Date;

	@Column({ name: ColumnName.Audit.createdBy })
	createdBy: string;

	@UpdateDateColumn({ name: ColumnName.Audit.updatedAt })
	updatedAt: Date;

	@Column({ name: ColumnName.Audit.updatedBy })
	updatedBy: string;

	@Column({ name: ColumnName.Audit.isActive, type: "boolean", default: true })
	isActive: boolean;

	@OneToMany(
		() => UserLanguageCollectionEntity,
		(userLanguageCollection) => userLanguageCollection.language,
		{ createForeignKeyConstraints: false },
	)
	userLanguageCollections: UserLanguageCollectionEntity[];
}
