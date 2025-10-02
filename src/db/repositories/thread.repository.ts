import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base-repository";
import { DataSource } from "typeorm";
import { ThreadEntity } from "@db/entities";

@Injectable()
export class ThreadRepository extends BaseRepository<ThreadEntity> {
	constructor(datasource: DataSource) {
		super(ThreadEntity, datasource.createEntityManager());
	}
}
