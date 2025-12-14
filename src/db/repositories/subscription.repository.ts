import { SubscriptionEntity } from "@db/entities";
import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { BaseRepository } from "./base-repository";

@Injectable()
export class SubscriptionRepository extends BaseRepository<SubscriptionEntity> {
	constructor(datasource: DataSource) {
		super(SubscriptionEntity, datasource.createEntityManager());
	}
}
