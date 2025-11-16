import { DbConstants } from "@db/db-constants";
import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

const { TableName, ColumnName, IndexName } = DbConstants;

@Entity(TableName.Attachment)
export class AttachmentEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.Attachment.id })
	id: string;

	@Column({
		name: ColumnName.Attachment.messageId,
		type: "uuid",
		nullable: true,
	})
	@Index(IndexName.Attachment.messageId)
	messageId: string;

	@Column({ name: ColumnName.Attachment.channelId, nullable: true })
	channelId: string;

	@Column({ name: ColumnName.Attachment.fileName, length: 255 })
	fileName: string;

	@Column({ name: ColumnName.Attachment.originalFileName, length: 255 })
	originalFileName: string;

	@Column({ name: ColumnName.Attachment.filePath, type: "text" })
	filePath: string;

	@Column({ name: ColumnName.Attachment.fileSize, type: "int" })
	fileSize: number;

	@Column({ name: ColumnName.Attachment.fileType, length: 100 })
	fileType: string;

	@Column({ name: ColumnName.Attachment.folder, length: 100 })
	folder: string;

	@Column({ name: ColumnName.Attachment.format, length: 50 })
	format: string;

	@Column({ name: ColumnName.Attachment.publicId, length: 255 })
	publicId: string;

	@Column({
		name: ColumnName.Attachment.uploadedBy,
		type: "uuid",
		nullable: true,
	})
	uploadedBy: string | null;

	@Column({
		name: ColumnName.Audit.createdAt,
		type: "datetime",
		default: () => "CURRENT_TIMESTAMP",
	})
	createdAt: Date;

	@Column({
		name: ColumnName.Audit.updatedAt,
		type: "datetime",
		default: () => "CURRENT_TIMESTAMP",
		onUpdate: "CURRENT_TIMESTAMP",
	})
	updatedAt: Date;

	@Column({
		name: ColumnName.Audit.deletedAt,
		type: "datetime",
		nullable: true,
	})
	deletedAt: Date | null;
}
