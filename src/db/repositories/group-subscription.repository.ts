import { GroupSubscriptionEntity } from "@db/entities";
import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { BaseRepository } from "./base-repository";

@Injectable()
export class GroupSubscriptionRepository extends BaseRepository<GroupSubscriptionEntity> {
	constructor(datasource: DataSource) {
		super(GroupSubscriptionEntity, datasource.createEntityManager());
	}
}
