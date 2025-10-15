import { Injectable } from "@nestjs/common";
import { BaseRepository } from "./base-repository";
import { TodoEntity } from "@db/entities";
import { DataSource } from "typeorm";

@Injectable()
export class TodoRepository extends BaseRepository<TodoEntity> {
	constructor(dataSource: DataSource) {
		super(TodoEntity, dataSource.createEntityManager());
	}
}
