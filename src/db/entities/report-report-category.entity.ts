import { DbConstants } from "@db/db-constants";
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";
import { ReportCategoryEntity } from "./report-category.entity";
import { ReportEntity } from "./report.entity";

const { TableName, ColumnName } = DbConstants;

@Entity(TableName.ReportReportCategory)
export class ReportReportCategoryEntity {
	@PrimaryGeneratedColumn("uuid", { name: ColumnName.ReportReportCategory.id })
	id: string;

	@Column({ name: ColumnName.Report.id })
	reportId: string;

	@ManyToOne(() => ReportEntity, (report) => report.reportReportCategories)
	@JoinColumn({ name: ColumnName.Report.id })
	report: ReportEntity;

	@Column({ name: ColumnName.ReportCategory.id })
	reportCategoryId: string;

	@ManyToOne(() => ReportCategoryEntity)
	@JoinColumn({ name: ColumnName.ReportCategory.id })
	reportCategory: ReportCategoryEntity;
}
