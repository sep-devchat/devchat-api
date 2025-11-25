import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base-repository";
import { ReportCategoryEntity } from "@db/entities";
import { DataSource } from "typeorm";

@Injectable()
export class ReportCategoryRepository extends BaseRepository<ReportCategoryEntity> {
	constructor(datasource: DataSource) {
		super(ReportCategoryEntity, datasource.createEntityManager());
	}
}
