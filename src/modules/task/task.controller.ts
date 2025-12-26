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
	UpdateTaskStatusRequest,
	TaskQuery,
	TaskResponse,
	TaskStatisticsResponse,
	AuditLogResponse,
} from "./dto";
import { ApiResponseDto, AuditLog, SwaggerApiResponse } from "@utils";
import { GroupGuard } from "@modules/group";
import { GroupOwnerGuard } from "./guards/group-owner.guard";
import { ApiBearerAuth, ApiOperation, ApiParam } from "@nestjs/swagger";
import { TaskEntity } from "@db/entities";

@Controller("group/:groupId/task")
@ApiParam({ name: "groupId", description: "Group ID" })
@UseGuards(GroupGuard)
@ApiBearerAuth()
export class TaskController {
	constructor(private readonly taskService: TaskService) {}

	// Only group owners can create tasks
	@Post()
	@UseGuards(GroupOwnerGuard)
	@ApiOperation({ summary: "Create a new task in group (Group Owner Only)" })
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

	// All group members can view task statistics
	@Get("statistics")
	@ApiOperation({ summary: "Get task statistics for the group" })
	@SwaggerApiResponse(TaskStatisticsResponse)
	async getStatistics(
		@Query("startDate") startDate?: string,
		@Query("endDate") endDate?: string,
	) {
		const data = await this.taskService.getStatistics(startDate, endDate);
		return new ApiResponseDto(
			data,
			null,
			"Task statistics retrieved successfully",
		);
	}

	// All group members can search and filter tasks
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

	// Only group owners can fully update tasks
	@Put(":id")
	@UseGuards(GroupOwnerGuard)
	@ApiParam({ name: "id", description: "Task ID" })
	@ApiOperation({ summary: "Update a task (Group Owner Only)" })
	@SwaggerApiResponse(TaskResponse)
	@AuditLog({
		action: "TASK_UPDATE",
		entityType: "Task",
		entityIdParam: "id",
		entity: TaskEntity,
		captureResponse: true,
	})
	async updateOne(@Param("id") id: string, @Body() dto: UpdateTaskRequest) {
		const response = await this.taskService.updateOne(id, dto);
		return new ApiResponseDto(
			TaskResponse.fromEntity(response),
			null,
			"Updated successfully",
		);
	}

	// All group members can update only task status
	@Put(":id/status")
	@ApiParam({ name: "id", description: "Task ID" })
	@ApiOperation({ summary: "Update task status only (All Members)" })
	@SwaggerApiResponse(TaskResponse)
	@AuditLog({
		action: "TASK_STATUS_UPDATE",
		entityType: "Task",
		entityIdParam: "id",
		entity: TaskEntity,
		captureResponse: true,
	})
	async updateStatus(
		@Param("id") id: string,
		@Body() dto: UpdateTaskStatusRequest,
	) {
		const response = await this.taskService.updateTaskStatus(id, dto);
		return new ApiResponseDto(
			TaskResponse.fromEntity(response),
			null,
			"Status updated successfully",
		);
	}

	// All group members can view task details
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

	// All group members can view task history
	@Get(":id/history")
	@ApiParam({ name: "id", description: "Task ID" })
	@ApiOperation({ summary: "Get task activity history" })
	@SwaggerApiResponse(AuditLogResponse, { isArray: true })
	async getTaskHistory(@Param("id") id: string) {
		const data = await this.taskService.getTaskHistory(id);
		return new ApiResponseDto(
			AuditLogResponse.fromTaskHistories(data),
			null,
			"Task history retrieved successfully",
		);
	}

	// Only group owners can delete tasks
	@Delete(":id")
	@UseGuards(GroupOwnerGuard)
	@ApiParam({ name: "id", description: "Task ID" })
	@ApiOperation({ summary: "Delete a task (Group Owner Only)" })
	@AuditLog({
		action: "TASK_DELETE",
		entityType: "Task",
		entityIdParam: "id",
		entity: TaskEntity,
	})
	async deleteOne(@Param("id") id: string) {
		await this.taskService.deleteOne(id);
		return new ApiResponseDto(null, null, "Deleted successfully");
	}
}
