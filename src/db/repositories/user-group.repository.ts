import { UserGroupEntity } from "@db/entities";
import { BaseRepository } from "./base-repository";
import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UserGroupRepository extends BaseRepository<UserGroupEntity> {
	constructor(dataSource: DataSource) {
		super(UserGroupEntity, dataSource.createEntityManager());
	}
}
