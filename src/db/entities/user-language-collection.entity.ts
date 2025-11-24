import { DbConstants } from "@db/db-constants";
import { ProgrammingLanguageProficiencyLevel } from "@utils";
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "./user.entity";
import { SupportedProgrammingLanguageEntity } from "./supported-programming-language.entity";

const { TableName, ColumnName } = DbConstants;

@Entity(TableName.UserLanguageCollection)
export class UserLanguageCollectionEntity {
	@PrimaryGeneratedColumn("uuid", {
		name: ColumnName.UserLanguageCollection.id,
	})
	id: string;

	@Column({ name: ColumnName.UserLanguageCollection.userId })
	userId: string;

	@JoinColumn({ name: ColumnName.UserLanguageCollection.userId })
	@ManyToOne(() => UserEntity)
	user: UserEntity;

	@Column({ name: ColumnName.UserLanguageCollection.languageId })
	languageId: string;

	@JoinColumn({ name: ColumnName.UserLanguageCollection.languageId })
	@ManyToOne(
		() => SupportedProgrammingLanguageEntity,
		(language) => language.userLanguageCollections,
	)
	language: SupportedProgrammingLanguageEntity;

	@Column({
		name: ColumnName.UserLanguageCollection.proficiencyLevel,
		type: "varchar",
		length: 50,
	})
	proficiencyLevel: ProgrammingLanguageProficiencyLevel;

	@Column({ name: ColumnName.UserLanguageCollection.orderIndex, type: "int" })
	orderIndex: number;

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
}
