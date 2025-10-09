import { AuditLogEntity } from "@db/entities";
import { BaseRepository } from "./base-repository";
import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class AuditLogRepository extends BaseRepository<AuditLogEntity> {
	constructor(datasource: DataSource) {
		super(AuditLogEntity, datasource.createEntityManager());
	}
}
