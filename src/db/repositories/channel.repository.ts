import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base-repository";
import { ChannelEntity } from "@db/entities";
import { DataSource } from "typeorm";

@Injectable()
export class ChannelRepository extends BaseRepository<ChannelEntity> {
	constructor(datasource: DataSource) {
		super(ChannelEntity, datasource.createEntityManager());
	}
}
