import {
	Controller,
	Param,
	Body,
	Query,
	Post,
	Get,
	Put,
	Delete,
} from "@nestjs/common";
import { TaskService } from "./task.service";
import { CreateTaskRequest, UpdateTaskRequest, TaskQuery } from "./dto";
import { ApiResponseDto } from "@utils";

@Controller("task")
export class TaskController {
	constructor(private readonly taskService: TaskService) {}

	@Post()
	async createOne(@Body() dto: CreateTaskRequest) {
		await this.taskService.createOne(dto);
		return new ApiResponseDto(null, null, "Created successfully");
	}

	@Put(":id")
	async updateOne(@Param("id") id: string, @Body() dto: UpdateTaskRequest) {
		await this.taskService.updateOne(id, dto);
		return new ApiResponseDto(null, null, "Updated successfully");
	}

	@Get()
	async findMany(@Query() query: TaskQuery) {
		const data = await this.taskService.findMany(query);
		return new ApiResponseDto(data);
	}

	@Get(":id")
	async findOne(@Param("id") id: string) {
		const data = await this.taskService.findOne(id);
		return new ApiResponseDto(data);
	}

	@Delete(":id")
	async deleteOne(@Param("id") id: string) {
		await this.taskService.deleteOne(id);
		return new ApiResponseDto(null, null, "Deleted successfully");
	}
}
