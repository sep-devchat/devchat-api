import { ShareFundEntity } from "@db/entities";
import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { BaseRepository } from "./base-repository";

@Injectable()
export class ShareFundRepository extends BaseRepository<ShareFundEntity> {
	constructor(datasource: DataSource) {
		super(ShareFundEntity, datasource.createEntityManager());
	}
}
