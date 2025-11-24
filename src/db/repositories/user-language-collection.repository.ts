import {
	UserLanguageCollectionEntity,
	SupportedProgrammingLanguageEntity,
} from "@db/entities";
import { BaseRepository } from "./base-repository";
import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";
import { ProgrammingLanguageProficiencyLevel } from "@utils";

export interface UserLanguageCollectionFilters {
	userId?: string;
	languageId?: string;
	proficiencyLevel?: ProgrammingLanguageProficiencyLevel;
	search?: string;
	page?: number;
	take?: number;
}

@Injectable()
export class UserLanguageCollectionRepository extends BaseRepository<UserLanguageCollectionEntity> {
	constructor(dataSource: DataSource) {
		super(UserLanguageCollectionEntity, dataSource.createEntityManager());
	}
}
