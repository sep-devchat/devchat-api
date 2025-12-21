import { Injectable } from "@nestjs/common";
import { CreateTaskRequest, UpdateTaskRequest, TaskQuery } from "./dto";
import { TaskRepository, TaskHistoryRepository } from "@db/repositories";
import { ClsService } from "nestjs-cls";
import {
	DevChatCls,
	PaginationDto,
	TaskStatusEnum,
	TaskPriorityEnum,
} from "@utils";
import { UserService } from "@modules/user";
import {
	FindOptionsWhere,
	ILike,
	IsNull,
	In,
	Between,
	MoreThanOrEqual,
	LessThanOrEqual,
	DataSource,
} from "typeorm";
import { TaskEntity, TaskHistoryEntity } from "@db/entities";
import { AssigneeIsNotGroupMember, TaskLocked, TaskNotFound } from "./errors";
import { GroupService } from "@modules/group";
import { UserGroupService } from "@modules/user-group";

@Injectable()
export class TaskService {
	constructor(
		private readonly repo: TaskRepository,
		private readonly taskHistoryRepo: TaskHistoryRepository,
		private readonly userGroupService: UserGroupService,
		private readonly groupService: GroupService,
		private readonly userService: UserService,
		private readonly cls: ClsService<DevChatCls>,
		private readonly dataSource: DataSource,
	) {}

	async validateBeforeCreate(groupId: string, assigneeId: string) {
		await this.groupService.findOne(groupId);

		await this.userService.findById(assigneeId);

		// validate if assignee is the member of required group
		const isMember = await this.userGroupService.isMember(groupId, assigneeId);

		if (!isMember) {
			throw new AssigneeIsNotGroupMember();
		}
	}

	async createOne(dto: CreateTaskRequest) {
		const userId = this.cls.get("profile").id;
		const groupId = this.cls.get("group").id;

		await this.validateBeforeCreate(groupId, dto.assigneeId);

		const task = this.repo.create({
			name: dto.name,
			description: dto.description,
			priority: dto.priority,
			status: dto.status,
			startDate: dto.startDate,
			dueDate: dto.dueDate,
			assigneeId: dto.assigneeId,
			groupId,
			createdBy: userId,
		});

		await this.repo.insert(task);

		// Save task creation history
		await this.saveTaskHistory(task.id, userId, "create", null, {
			name: dto.name,
			description: dto.description,
			status: dto.status,
			priority: dto.priority,
			startDate: dto.startDate,
			dueDate: dto.dueDate,
			assigneeId: dto.assigneeId,
		});

		// Return with relations
		return await this.repo.findOne({
			where: { id: task.id },
			relations: ["assignee", "creator", "group"],
		});
	}

	async findByGroup(query: TaskQuery) {
		const groupId = this.cls.get("group").id;

		const {
			page,
			limit,
			assigneeId,
			status,
			priority,
			search,
			unassigned,
			startDateFrom,
			startDateTo,
			dueDateFrom,
			dueDateTo,
		} = query;

		// Build where conditions
		const where: FindOptionsWhere<TaskEntity> = {
			groupId,
			isActive: true,
		};

		// Filter by assignee
		if (assigneeId) {
			await this.userService.findById(assigneeId);
			where.assigneeId = assigneeId;
		}

		// Filter by status (supports multiple values)
		if (status?.length) {
			where.status = In(status);
		}

		// Filter by priority (supports multiple values)
		if (priority?.length) {
			where.priority = In(priority);
		}

		// Filter unassigned tasks
		if (unassigned === true) {
			where.assigneeId = IsNull();
		}

		// Date range filters for start date
		if (startDateFrom && startDateTo) {
			where.startDate = Between(new Date(startDateFrom), new Date(startDateTo));
		} else if (startDateFrom) {
			where.startDate = MoreThanOrEqual(new Date(startDateFrom));
		} else if (startDateTo) {
			where.startDate = LessThanOrEqual(new Date(startDateTo));
		}

		// Date range filters for due date
		if (dueDateFrom && dueDateTo) {
			where.dueDate = Between(new Date(dueDateFrom), new Date(dueDateTo));
		} else if (dueDateFrom) {
			where.dueDate = MoreThanOrEqual(new Date(dueDateFrom));
		} else if (dueDateTo) {
			where.dueDate = LessThanOrEqual(new Date(dueDateTo));
		}

		const findOptions = {
			where,
			relations: ["assignee", "creator", "group"],
			skip: (page - 1) * limit,
			take: limit,
			order: { createdAt: "DESC" as const },
		};

		// Handle search separately if needed
		if (search) {
			const [data, total] = await this.repo.findAndCount({
				where: [
					{ ...where, name: ILike(`%${search}%`) },
					{ ...where, description: ILike(`%${search}%`) },
				],
				relations: findOptions.relations,
				skip: findOptions.skip,
				take: findOptions.take,
				order: findOptions.order,
			});

			const pagination = new PaginationDto(page, limit, total);
			return { data, pagination };
		}

		// Regular find without search
		const [data, total] = await this.repo.findAndCount(findOptions);

		const pagination = new PaginationDto(page, limit, total);

		return {
			data,
			pagination,
		};
	}
	async updateOne(id: string, dto: UpdateTaskRequest) {
		const userId = this.cls.get("profile").id;
		const existingTask = await this.findOne(id);
		this.ensureTaskIsEditable(existingTask);

		if (dto.assigneeId && dto.assigneeId !== existingTask.assigneeId) {
			await this.userService.findById(dto.assigneeId);
			// Also validate assignee is member of the group
			const isMember = await this.userGroupService.isMember(
				existingTask.groupId,
				dto.assigneeId,
			);

			if (!isMember) {
				throw new AssigneeIsNotGroupMember();
			}
		}

		// Track changes for history
		const oldValues = {
			name: existingTask.name,
			description: existingTask.description,
			status: existingTask.status,
			priority: existingTask.priority,
			startDate: existingTask.startDate,
			dueDate: existingTask.dueDate,
			assigneeId: existingTask.assigneeId,
		};

		await this.repo.update(id, {
			...dto,
			updatedAt: new Date(),
		});

		// Save update history
		await this.saveTaskHistory(id, userId, "update", oldValues, dto);

		// Return updated task with relations
		return await this.repo.findOne({
			where: { id },
			relations: ["assignee", "creator", "group"],
		});
	}

	async findOne(id: string) {
		const groupId = this.cls.get("group").id;
		const existingTask = await this.repo.findOne({
			where: {
				id,
				groupId,
				isActive: true,
			},
			relations: ["assignee", "creator", "group"],
		});

		if (!existingTask) {
			throw new TaskNotFound();
		}

		return existingTask;
	}

	async updateTaskStatus(id: string, dto: { status: number }) {
		const userId = this.cls.get("profile").id;
		const existingTask = await this.findOne(id);
		this.ensureTaskIsEditable(existingTask);

		const oldStatus = existingTask.status;

		await this.repo.update(id, {
			status: dto.status,
			updatedAt: new Date(),
		});

		// Save status change history
		await this.saveTaskHistory(
			id,
			userId,
			"update",
			{ status: oldStatus },
			{ status: dto.status },
		);

		// Return updated task with relations
		return await this.repo.findOne({
			where: { id },
			relations: ["assignee", "creator", "group"],
		});
	}

	async deleteOne(id: string) {
		const userId = this.cls.get("profile").id;
		const existingTask = await this.findOne(id);
		this.ensureTaskIsEditable(existingTask);

		if (existingTask.createdBy === userId) {
			// throw new NotAllowDelete()
		}

		// Save delete history before deletion
		await this.saveTaskHistory(
			id,
			userId,
			"delete",
			{
				name: existingTask.name,
				description: existingTask.description,
				status: existingTask.status,
				priority: existingTask.priority,
			},
			null,
		);

		await this.repo.update(id, {
			isActive: false,
			updatedAt: new Date(),
		});

		return { message: "Task deleted successfully" };
	}

	private isTaskLocked(task: TaskEntity): boolean {
		if (task.status !== TaskStatusEnum.DONE || !task.updatedAt) {
			return false;
		}

		const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
		const lockThreshold = Date.now() - threeDaysInMs;
		return task.updatedAt.getTime() <= lockThreshold;
	}

	private ensureTaskIsEditable(task: TaskEntity) {
		if (this.isTaskLocked(task)) {
			throw new TaskLocked();
		}
	}

	async getStatistics() {
		const groupId = this.cls.get("group").id;

		// Get all active tasks for the group
		const tasks = await this.repo.find({
			where: {
				groupId,
				isActive: true,
			},
		});

		const totalTasks = tasks.length;

		// Calculate statistics by status
		const todoCount = tasks.filter(
			(t) => t.status === TaskStatusEnum.TODO,
		).length;
		const inProgressCount = tasks.filter(
			(t) => t.status === TaskStatusEnum.IN_PROGRESS,
		).length;
		const doneCount = tasks.filter(
			(t) => t.status === TaskStatusEnum.DONE,
		).length;

		// Calculate statistics by priority
		const lowPriorityCount = tasks.filter((t) => t.priority === 0).length;
		const mediumPriorityCount = tasks.filter((t) => t.priority === 1).length;
		const highPriorityCount = tasks.filter((t) => t.priority === 2).length;

		// Calculate other statistics
		const pendingTasks = todoCount + inProgressCount;
		const completedTasks = doneCount;
		const unassignedTasks = tasks.filter((t) => !t.assigneeId).length;

		// Calculate overdue tasks (past due date and not done)
		const now = new Date();
		const overdueTasks = tasks.filter(
			(t) =>
				t.dueDate &&
				new Date(t.dueDate) < now &&
				t.status !== TaskStatusEnum.DONE,
		).length;

		return {
			totalTasks,
			pendingTasks,
			completedTasks,
			unassignedTasks,
			overdueTasks,
			byStatus: {
				todo: todoCount,
				inProgress: inProgressCount,
				done: doneCount,
			},
			byPriority: {
				low: lowPriorityCount,
				medium: mediumPriorityCount,
				high: highPriorityCount,
			},
		};
	}

	async getTaskHistory(taskId: string) {
		const groupId = this.cls.get("group").id;

		// Verify task exists and belongs to the group
		const task = await this.findOne(taskId);
		if (task.groupId !== groupId) {
			throw new TaskNotFound();
		}

		// Get task history from TaskHistory table
		const history = await this.taskHistoryRepo.findByTaskId(taskId);
		return history;
	}

	private async saveTaskHistory(
		taskId: string,
		userId: string,
		action: string,
		oldValues: any,
		newValues: any,
	) {
		const changes = await this.getChangedFields(oldValues, newValues);

		// Save each field change as a separate history entry
		for (const change of changes) {
			const history = this.taskHistoryRepo.create({
				taskId,
				userId,
				action,
				fieldName: change.field,
				oldValue: change.oldValue,
				newValue: change.newValue,
				createdAt: new Date(),
			});

			await this.taskHistoryRepo.insert(history);
		}
	}

	private async getChangedFields(
		oldValues: any,
		newValues: any,
	): Promise<
		Array<{
			field: string;
			oldValue: string | null;
			newValue: string | null;
		}>
	> {
		if (!oldValues && newValues) {
			// Creation - all fields are new
			const result = [];
			for (const [field, value] of Object.entries(newValues)) {
				result.push({
					field,
					oldValue: null,
					newValue: await this.formatValue(field, value),
				});
			}
			return result;
		}

		if (oldValues && !newValues) {
			// Deletion - all fields are removed
			const result = [];
			for (const [field, value] of Object.entries(oldValues)) {
				result.push({
					field,
					oldValue: await this.formatValue(field, value),
					newValue: null,
				});
			}
			return result;
		}

		// Update - compare fields
		const changes: Array<{
			field: string;
			oldValue: string | null;
			newValue: string | null;
		}> = [];
		const allFields = new Set([
			...Object.keys(oldValues || {}),
			...Object.keys(newValues || {}),
		]);

		for (const field of allFields) {
			const oldValue = oldValues?.[field];
			const newValue = newValues?.[field];

			if (oldValue !== newValue) {
				changes.push({
					field,
					oldValue: await this.formatValue(field, oldValue),
					newValue: await this.formatValue(field, newValue),
				});
			}
		}

		return changes;
	}

	private async formatValue(field: string, value: any): Promise<string | null> {
		if (value === null || value === undefined) return null;

		// Format status
		if (field === "status") {
			const statusMap = { 0: "To Do", 1: "In Progress", 2: "Done" };
			return statusMap[value] || String(value);
		}

		// Format priority
		if (field === "priority") {
			const priorityMap = { 0: "Low", 1: "Medium", 2: "High" };
			return priorityMap[value] || String(value);
		}

		// Format dates
		if (field === "startDate" || field === "dueDate") {
			return value instanceof Date ? value.toISOString() : String(value);
		}

		// Format assigneeId to assignee name
		if (field === "assigneeId") {
			if (!value) return null;
			try {
				const assignee = await this.userService.findById(value);
				return assignee.username || assignee.email || String(value);
			} catch {
				return String(value);
			}
		}

		return String(value);
	}
}
