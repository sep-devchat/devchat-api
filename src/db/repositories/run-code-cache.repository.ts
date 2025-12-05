import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base-repository";
import { RunCodeCacheEntity } from "@db/entities";
import { DataSource } from "typeorm";

@Injectable()
export class RunCodeCacheRepostiroy extends BaseRepository<RunCodeCacheEntity> {
	constructor(datasource: DataSource) {
		super(RunCodeCacheEntity, datasource.createEntityManager());
	}
}
