import { TaskHistoryEntity } from "@db/entities";
import { BaseRepository } from "./base-repository";
import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class TaskHistoryRepository extends BaseRepository<TaskHistoryEntity> {
	constructor(dataSource: DataSource) {
		super(TaskHistoryEntity, dataSource.createEntityManager());
	}

	async findByTaskId(taskId: string): Promise<TaskHistoryEntity[]> {
		return this.find({
			where: { taskId },
			relations: ["user"],
			order: { createdAt: "DESC" },
		});
	}
}
