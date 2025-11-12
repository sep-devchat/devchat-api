import { FriendRequestEntity } from "@db/entities";
import { BaseRepository } from "./base-repository";
import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class FriendRequestRepository extends BaseRepository<FriendRequestEntity> {
	constructor(dataSource: DataSource) {
		super(FriendRequestEntity, dataSource.createEntityManager());
	}
}
