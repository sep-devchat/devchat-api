import { SupportedProgrammingLanguageEntity } from "@db/entities";
import { BaseRepository } from "./base-repository";
import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class SupportedProgrammingLanguageRepository extends BaseRepository<SupportedProgrammingLanguageEntity> {
	constructor(dataSource: DataSource) {
		super(SupportedProgrammingLanguageEntity, dataSource.createEntityManager());
	}
}
