import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base-repository";
import { PermissionEntity } from "@db/entities";
import { DataSource } from "typeorm";

@Injectable()
export class PermissionRepository extends BaseRepository<PermissionEntity> {
	constructor(datasource: DataSource) {
		super(PermissionEntity, datasource.createEntityManager());
	}
}
