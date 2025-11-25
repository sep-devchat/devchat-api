import { SupportedProgrammingLanguageEntity } from "@db/entities";
import { BaseRepository } from "./base-repository";
import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";

export interface SupportedProgrammingLanguageFilters {
	code?: string;
	name?: string;
	version?: string;
	search?: string;
	page?: number;
	take?: number;
}

@Injectable()
export class SupportedProgrammingLanguageRepository extends BaseRepository<SupportedProgrammingLanguageEntity> {
	constructor(dataSource: DataSource) {
		super(SupportedProgrammingLanguageEntity, dataSource.createEntityManager());
	}

	async findFiltered(
		filters: SupportedProgrammingLanguageFilters,
	): Promise<[SupportedProgrammingLanguageEntity[], number]> {
		const { code, name, version, search, page = 1, take = 20 } = filters;
		const skip = (page - 1) * take;
		const qb = this.createQueryBuilder("lang");
		if (code) qb.andWhere("lang.languageCode = :code", { code });
		if (name)
			qb.andWhere("lang.languageName LIKE :name", { name: `%${name}%` });
		if (version) qb.andWhere("lang.languageVersion = :version", { version });
		if (search)
			qb.andWhere(
				"(lang.languageCode LIKE :search OR lang.languageName LIKE :search)",
				{ search: `%${search}%` },
			);
		qb.orderBy("lang.languageName", "ASC");
		qb.skip(skip).take(take);
		return qb.getManyAndCount();
	}
}
