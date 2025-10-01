import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base-repository";
import { UserMessageDeleteEntity } from "@db/entities";
import { DataSource } from "typeorm";

@Injectable()
export class UserMessageDeleteRepository extends BaseRepository<UserMessageDeleteEntity> {
	constructor(datasource: DataSource) {
		super(UserMessageDeleteEntity, datasource.createEntityManager());
	}
}
