import { ReportReportCategoryEntity } from "@db/entities";
import { BaseRepository } from "./base-repository";
import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ReportReportCategoryRepository extends BaseRepository<ReportReportCategoryEntity> {
	constructor(datasource: DataSource) {
		super(ReportReportCategoryEntity, datasource.createEntityManager());
	}
}
