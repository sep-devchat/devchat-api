import { DbConstants } from "@db/db-constants";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.ReportCategory)
export class ReportCategoryEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.ReportCategory.id })
	id: string;

	@Column({ name: ColumnName.ReportCategory.name, length: 100 })
	name: string;

	@Column({ name: ColumnName.ReportCategory.description, type: "text" })
	description: string;

	@Column({
		name: ColumnName.ReportCategory.isRemoved,
		type: "boolean",
		default: false,
	})
	isRemoved: boolean;
}
