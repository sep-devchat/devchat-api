import { UserEntity } from "@db/entities";
import { BaseRepository } from "./base-repository";
import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class UserRepository extends BaseRepository<UserEntity> {
	constructor(datasource: DataSource) {
		super(UserEntity, datasource.createEntityManager());
	}
}
