import { Injectable } from "@nestjs/common";
import { CreateTaskRequest, UpdateTaskRequest, TaskQuery } from "./dto";

@Injectable()
export class TaskService {
	async createOne(dto: CreateTaskRequest) {}

	async updateOne(id: string | number, dto: UpdateTaskRequest) {}

	async findMany(query: TaskQuery) {}

	async findOne(id: string | number) {}

	async deleteOne(id: string | number) {}
}
