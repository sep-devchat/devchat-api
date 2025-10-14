import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { BaseRepository } from "./base-repository";
import { AiSessionEntity } from "@db/entities";

@Injectable()
export class AiSessionRepository extends BaseRepository<AiSessionEntity> {
	constructor(dataSource: DataSource) {
		super(AiSessionEntity, dataSource.createEntityManager());
	}
}
