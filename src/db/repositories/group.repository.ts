import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base-repository";
import { DataSource } from "typeorm";
import { GroupEntity } from "@db/entities";

@Injectable()
export class GroupRepository extends BaseRepository<GroupEntity> {
	constructor(datasource: DataSource) {
		super(GroupEntity, datasource.createEntityManager());
	}
}
