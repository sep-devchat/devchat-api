import { Injectable } from "@nestjs/common";
import { CreateTodoRequest, UpdateTodoRequest, TodoQuery } from "./dto";
import { TodoRepository } from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls, PaginationDto } from "@utils";
import { TodoNotFound } from "./errors";

@Injectable()
export class TodoService {
	constructor(
		private readonly repo: TodoRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	async createOne(dto: CreateTodoRequest) {
		const userId = this.cls.get("profile").id;

		const todo = this.repo.create({
			name: dto.name,
			userId,
			description: dto.description,
			status: dto.status,
			priority: dto.priority,
			dueDate: dto.dueDate,
		});

		await this.repo.insert(todo);

		return todo;
	}

	async updateOne(id: string, dto: UpdateTodoRequest) {
		const existingTodo = await this.findOne(id);

		await this.repo.update(id, {
			...dto,
			updatedAt: new Date(),
		});

		return existingTodo;
	}

	async findMany(query: TodoQuery) {
		const { page, limit } = query;
		const userId = this.cls.get("profile").id;

		const [data, total] = await this.repo.findAndCount({
			where: {
				userId,
				isActive: true,
			},
			skip: (page - 1) * limit,
			take: limit,
			order: { createdAt: "DESC" },
		});

		const pagination = new PaginationDto(page, limit, total);

		return {
			data,
			pagination,
		};
	}

	async findOne(id: string) {
		const userId = this.cls.get("profile").id;

		const existingTodo = await this.repo.findOne({
			where: {
				id,
				userId,
				isActive: true,
			},
		});

		if (!existingTodo) {
			throw new TodoNotFound();
		}

		return existingTodo;
	}

	async deleteOne(id: string) {
		// Call the service to validate that todo request is exist
		await this.findOne(id);

		await this.repo.update(id, {
			isActive: false,
			updatedAt: new Date(),
		});
	}
}
