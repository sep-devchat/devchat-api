import { TransactionEntity } from "@db/entities";
import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { BaseRepository } from "./base-repository";

@Injectable()
export class TransactionRepository extends BaseRepository<TransactionEntity> {
	constructor(datasource: DataSource) {
		super(TransactionEntity, datasource.createEntityManager());
	}
}
