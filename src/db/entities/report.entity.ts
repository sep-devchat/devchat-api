import { DbConstants } from "../db-constants";
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from "typeorm";
import { ReportReportCategoryEntity } from "./report-report-category.entity";
import { UserEntity } from "./user.entity";
import { MessageEntity } from "./message.entity";
import { DirectMessageEntity } from "./direct-message.entity";
import { ThreadMessageEntity } from "./thread-message.entity";
import { MessageTypeEnum } from "@utils";

const { TableName, ColumnName } = DbConstants;

@Entity(TableName.Report)
export class ReportEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.Report.id })
	id: string;

	@Column({ name: ColumnName.Report.content, nullable: true })
	content: string | null;

	@Column({ name: ColumnName.Audit.createdBy })
	createdById: string;

	@ManyToOne(() => UserEntity)
	@JoinColumn({ name: ColumnName.Audit.createdBy })
	createdBy: UserEntity;

	@CreateDateColumn({ name: ColumnName.Audit.createdAt })
	createdAt: Date;

	@Column({ name: ColumnName.Message.id })
	messageId: string;

	@Column({ name: ColumnName.Report.messageType })
	messageType: MessageTypeEnum;

	@ManyToOne(() => MessageEntity)
	@JoinColumn({ name: ColumnName.Message.id })
	message: MessageEntity;

	@ManyToOne(() => DirectMessageEntity)
	@JoinColumn({ name: ColumnName.Message.id })
	directMessage: DirectMessageEntity;

	@ManyToOne(() => ThreadMessageEntity)
	@JoinColumn({ name: ColumnName.Message.id })
	threadMessage: ThreadMessageEntity;

	@OneToMany(() => ReportReportCategoryEntity, (rrc) => rrc.report, {
		cascade: true,
	})
	reportReportCategories: ReportReportCategoryEntity[];
}
