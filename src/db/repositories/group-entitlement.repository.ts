import { GroupEntitlementEntity } from "@db/entities";
import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { BaseRepository } from "./base-repository";

@Injectable()
export class GroupEntitlementRepository extends BaseRepository<GroupEntitlementEntity> {
	constructor(datasource: DataSource) {
		super(GroupEntitlementEntity, datasource.createEntityManager());
	}
}
