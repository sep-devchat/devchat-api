import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base-repository";
import { ReportEntity } from "@db/entities";
import { DataSource } from "typeorm";

@Injectable()
export class ReportRepository extends BaseRepository<ReportEntity> {
	constructor(datasource: DataSource) {
		super(ReportEntity, datasource.createEntityManager());
	}
}
