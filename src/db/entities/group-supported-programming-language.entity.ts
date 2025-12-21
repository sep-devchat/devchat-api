import { DbConstants } from "@db/db-constants";
import {
	Column,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { GroupEntity } from "./group.entity";
import { SupportedProgrammingLanguageEntity } from "./supported-programming-language.entity";

const { TableName, ColumnName } = DbConstants;

@Entity(TableName.GroupSupportedProgrammingLanguage)
@Index(["groupId", "supportedProgrammingLanguageId"], { unique: true })
export class GroupSupportedProgrammingLanguageEntity {
	@PrimaryGeneratedColumn("uuid", {
		name: ColumnName.GroupSupportedProgrammingLanguage.id,
	})
	id: string;

	@Column({ name: ColumnName.GroupSupportedProgrammingLanguage.groupId })
	groupId: string;

	@ManyToOne(
		() => GroupEntity,
		(group) => group.groupSupportedProgrammingLanguages,
		{
			createForeignKeyConstraints: false,
		},
	)
	@JoinColumn({ name: ColumnName.GroupSupportedProgrammingLanguage.groupId })
	group: GroupEntity;

	@Column({
		name: ColumnName.GroupSupportedProgrammingLanguage
			.supportedProgrammingLanguageId,
	})
	supportedProgrammingLanguageId: string;

	@ManyToOne(
		() => SupportedProgrammingLanguageEntity,
		(language) => language.groupSupportedProgrammingLanguages,
		{ createForeignKeyConstraints: false },
	)
	@JoinColumn({
		name: ColumnName.GroupSupportedProgrammingLanguage
			.supportedProgrammingLanguageId,
	})
	supportedProgrammingLanguage: SupportedProgrammingLanguageEntity;

	@Column({
		name: ColumnName.Audit.isActive,
		type: "boolean",
		default: true,
	})
	isActive: boolean;
}
