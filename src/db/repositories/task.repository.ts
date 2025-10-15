import { TaskEntity } from "@db/entities";
import { BaseRepository } from "./base-repository";
import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class TaskRepository extends BaseRepository<TaskEntity> {
	constructor(dataSource: DataSource) {
		super(TaskEntity, dataSource.createEntityManager());
	}
}
