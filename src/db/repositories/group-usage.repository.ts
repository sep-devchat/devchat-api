import { GroupUsageEntity } from "@db/entities";
import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { BaseRepository } from "./base-repository";

@Injectable()
export class GroupUsageRepository extends BaseRepository<GroupUsageEntity> {
	constructor(datasource: DataSource) {
		super(GroupUsageEntity, datasource.createEntityManager());
	}
}
