import { DbConstants } from "@db/db-constants";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

const { TableName, ColumnName } = DbConstants;

@Entity(TableName.AdminRole)
export class AdminRoleEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.AdminRole.id })
	id: string;

	@Column({ name: ColumnName.AdminRole.role })
	role: string;

	@Column({ name: ColumnName.AdminRole.roleName, length: 100 })
	roleName: string;

	@Column({ name: ColumnName.AdminRole.roleLevel })
	roleLevel: number;

	// MySQL doesn't support native array columns; use JSON to store string[]
	@Column({
		name: ColumnName.AdminRole.permissions,
		type: "json",
		nullable: false,
		transformer: {
			to: (value: string[] | null | undefined) => value ?? [],
			from: (value: any) => (Array.isArray(value) ? value : value ? value : []),
		},
	})
	permissions: string[];

	@Column({ name: ColumnName.Audit.isActive, type: "boolean", default: true })
	isActive: boolean;

	@Column({ name: ColumnName.Audit.createdBy })
	createdBy: string;

	@Column({ name: ColumnName.Audit.updatedBy, nullable: true })
	updatedBy: string | null;

	@Column({ name: ColumnName.Audit.deletedBy, nullable: true })
	deletedBy: string | null;

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
}
