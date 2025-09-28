import { MessageEntity } from "@db/entities";
import { BaseRepository } from "./base-repository";
import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class MessageRepository extends BaseRepository<MessageEntity> {
	constructor(datasource: DataSource) {
		super(MessageEntity, datasource.createEntityManager());
	}
}
