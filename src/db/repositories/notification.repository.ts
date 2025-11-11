import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base-repository";
import { NotificationEntity } from "@db/entities";
import { DataSource } from "typeorm";

@Injectable()
export class NotificationRepository extends BaseRepository<NotificationEntity> {
	constructor(private readonly datasource: DataSource) {
		super(NotificationEntity, datasource.createEntityManager());
	}
}
