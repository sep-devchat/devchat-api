import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { BaseRepository } from "./base-repository";
import { AiInteractionEntity } from "@db/entities";

@Injectable()
export class AiInteractionRepository extends BaseRepository<AiInteractionEntity> {
	constructor(dataSource: DataSource) {
		super(AiInteractionEntity, dataSource.createEntityManager());
	}
}
