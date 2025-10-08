import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base-repository";
import { AdminRoleEntity } from "@db/entities";
import { DataSource } from "typeorm";

@Injectable()
export class AdminRoleRepository extends BaseRepository<AdminRoleEntity> {
	constructor(datasource: DataSource) {
		super(AdminRoleEntity, datasource.createEntityManager());
	}
}
