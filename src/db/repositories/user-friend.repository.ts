import { UserFriendEntity } from "@db/entities";
import { BaseRepository } from "./base-repository";
import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UserFriendRepository extends BaseRepository<UserFriendEntity> {
	constructor(dataSource: DataSource) {
		super(UserFriendEntity, dataSource.createEntityManager());
	}
}
