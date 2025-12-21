import { GroupSupportedProgrammingLanguageEntity } from "@db/entities";
import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { BaseRepository } from "./base-repository";

@Injectable()
export class GroupSupportedProgrammingLanguageRepository extends BaseRepository<GroupSupportedProgrammingLanguageEntity> {
	constructor(dataSource: DataSource) {
		super(
			GroupSupportedProgrammingLanguageEntity,
			dataSource.createEntityManager(),
		);
	}
}
