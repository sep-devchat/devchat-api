import { CodeBlockEntity } from "@db/entities";
import { BaseRepository } from "./base-repository";
import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class CodeBlockRepository extends BaseRepository<CodeBlockEntity> {
	constructor(dataSource: DataSource) {
		super(CodeBlockEntity, dataSource.createEntityManager());
	}
}
