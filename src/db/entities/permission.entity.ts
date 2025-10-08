import { DbConstants } from "@db/db-constants";
import { Column, Entity } from "typeorm";

const { ColumnName, TableName } = DbConstants;

@Entity({ name: TableName.Permission })
export class PermissionEntity {
	@Column({
		name: ColumnName.Permission.id,
		type: "uuid",
		primary: true,
		generated: "uuid",
	})
	id: string;

	@Column({
		name: ColumnName.Permission.code,
		type: "varchar",
		length: 100,
		unique: true,
	})
	code: string;

	@Column({ name: ColumnName.Permission.name, type: "varchar", length: 200 })
	name: string;

	@Column({
		name: ColumnName.Permission.description,
		type: "text",
		nullable: true,
	})
	description: string;

	@Column({
		name: ColumnName.Audit.createdAt,
		type: "timestamp",
		default: () => "CURRENT_TIMESTAMP",
	})
	createdAt: Date;

	@Column({
		name: ColumnName.Audit.updatedAt,
		type: "timestamp",
		nullable: true,
		onUpdate: "CURRENT_TIMESTAMP",
	})
	updatedAt: Date | null;

	@Column({
		name: ColumnName.Audit.deletedAt,
		type: "timestamp",
		nullable: true,
	})
	deletedAt: Date | null;

	@Column({ name: ColumnName.Audit.createdBy, type: "uuid" })
	createdBy: string;

	@Column({ name: ColumnName.Audit.updatedBy, type: "uuid", nullable: true })
	updatedBy: string | null;

	@Column({ name: ColumnName.Audit.deletedBy, type: "uuid", nullable: true })
	deletedBy: string | null;

	@Column({ name: ColumnName.Audit.isActive, type: "boolean", default: true })
	isActive: boolean;
}
