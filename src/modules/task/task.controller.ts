import {
	Controller,
	Param,
	Body,
	Query,
	Post,
	Get,
	Put,
	Delete,
	UseGuards,
} from "@nestjs/common";
import { TaskService } from "./task.service";
import {
	CreateTaskRequest,
	UpdateTaskRequest,
	TaskQuery,
	TaskResponse,
} from "./dto";
import { ApiResponseDto, AuditLog, SwaggerApiResponse } from "@utils";
import { GroupGuard } from "@modules/group";
import { ApiOperation, ApiParam } from "@nestjs/swagger";

@Controller("group/:groupId/task")
@ApiParam({ name: "groupId", description: "Group ID" })
@UseGuards(GroupGuard)
export class TaskController {
	constructor(private readonly taskService: TaskService) {}

	@Post()
	@ApiOperation({ summary: "Create a new task in group" })
	@SwaggerApiResponse(TaskResponse)
	@AuditLog({
		action: "TASK_CREATE",
		entityType: "Task",
		captureResponse: true,
	})
	async createTask(@Body() dto: CreateTaskRequest) {
		const response = await this.taskService.createOne(dto);
		return new ApiResponseDto(
			TaskResponse.fromEntity(response),
			null,
			"Task created successfully",
		);
	}

	@Get()
	@ApiOperation({ summary: "Get all tasks in group" })
	@SwaggerApiResponse(TaskResponse, { withPagination: true, isArray: true })
	async getTasks(@Param("groupId") groupId: string, @Query() query: TaskQuery) {
		const { data, pagination } = await this.taskService.findByGroup(query);
		return new ApiResponseDto(
			TaskResponse.fromEntities(data),
			pagination,
			"Tasks retrieved successfully",
		);
	}

	@Put(":id")
	@ApiParam({ name: "id", description: "Task ID" })
	@ApiOperation({ summary: "Update a task" })
	@SwaggerApiResponse(TaskResponse)
	async updateOne(@Param("id") id: string, @Body() dto: UpdateTaskRequest) {
		const response = await this.taskService.updateOne(id, dto);
		return new ApiResponseDto(
			TaskResponse.fromEntity(response),
			null,
			"Updated successfully",
		);
	}

	@Get(":id")
	@ApiParam({ name: "id", description: "Task ID" })
	@ApiOperation({ summary: "Get a specific task" })
	@SwaggerApiResponse(TaskResponse)
	async findOne(@Param("id") id: string) {
		const data = await this.taskService.findOne(id);
		return new ApiResponseDto(
			TaskResponse.fromEntity(data),
			null,
			"Task retrieved successfully",
		);
	}

	@Delete(":id") // Fix: add colon and route parameter
	@ApiParam({ name: "id", description: "Task ID" })
	@ApiOperation({ summary: "Delete a task" })
	async deleteOne(@Param("id") id: string) {
		await this.taskService.deleteOne(id);
		return new ApiResponseDto(null, null, "Deleted successfully");
	}
}
