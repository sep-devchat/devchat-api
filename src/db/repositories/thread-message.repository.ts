import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base-repository";
import { ThreadMessageEntity } from "@db/entities";
import { DataSource } from "typeorm";

@Injectable()
export class ThreadMessageRepository extends BaseRepository<ThreadMessageEntity> {
	constructor(datasource: DataSource) {
		super(ThreadMessageEntity, datasource.createEntityManager());
	}
}
