import { CodeCollaborationEntity } from "@db/entities";
import { BaseRepository } from "./base-repository";
import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class CodeCollaborationRepository extends BaseRepository<CodeCollaborationEntity> {
	constructor(datasource: DataSource) {
		super(CodeCollaborationEntity, datasource.createEntityManager());
	}
}
