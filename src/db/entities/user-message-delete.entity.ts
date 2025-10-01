import { DbConstants } from "@db/db-constants";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

const { TableName, ColumnName } = DbConstants;

@Entity(TableName.UserMessageDelete)
export class UserMessageDeleteEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.UserMessageDelete.id })
	id: string;

	@Column({ name: ColumnName.UserMessageDelete.userId, type: "uuid" })
	userId: string;

	@Column({ name: ColumnName.UserMessageDelete.messageId, type: "uuid" })
	messageId: string;

	@Column({ name: ColumnName.Audit.deletedAt })
	deletedAt: Date;
}
