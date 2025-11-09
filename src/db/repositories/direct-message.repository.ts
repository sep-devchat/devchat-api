import { DirectMessageEntity } from "@db/entities";
import { BaseRepository } from "./base-repository";
import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class DirectMessageRepository extends BaseRepository<DirectMessageEntity> {
	constructor(datasource: DataSource) {
		super(DirectMessageEntity, datasource.createEntityManager());
	}
}
