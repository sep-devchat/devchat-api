import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateTaskRequest, UpdateTaskRequest, TaskQuery } from "./dto";
import { TaskRepository } from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls, PaginationDto } from "@utils";
import { UserService } from "@modules/user";
import { FindOptionsWhere, ILike, IsNull, LessThan, Between } from "typeorm";
import { TaskEntity } from "@db/entities";
import { AssigneeIsNotGroupMember, TaskNotFound } from "./errors";
import { GroupService } from "@modules/group";
import { UserGroupService } from "@modules/user-group";

@Injectable()
export class TaskService {
	constructor(
		private readonly repo: TaskRepository,
		private readonly userGroupService: UserGroupService,
		private readonly groupService: GroupService,
		private readonly userService: UserService,
		private readonly cls: ClsService<DevChatCls>,
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
			dueDate: dto.dueDate,
			assigneeId: dto.assigneeId,
			groupId,
			createdBy: userId,
		});

		await this.repo.insert(task);

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
			overdue,
			dueDate,
			unassigned,
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

		// Filter by status
		if (status !== undefined) {
			where.status = status;
		}

		// Filter by priority
		if (priority !== undefined) {
			where.priority = priority;
		}

		// Filter unassigned tasks
		if (unassigned === true) {
			where.assigneeId = IsNull();
		}

		// Filter overdue tasks
		if (overdue === true) {
			where.dueDate = LessThan(new Date());
		}

		// Filter by specific due date (entire day)
		if (dueDate) {
			const startOfDay = new Date(dueDate);
			startOfDay.setHours(0, 0, 0, 0);

			const endOfDay = new Date(dueDate);
			endOfDay.setHours(23, 59, 59, 999);

			where.dueDate = Between(startOfDay, endOfDay);
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
		const existingTask = await this.findOne(id);

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
		await this.repo.update(id, {
			...dto,
			updatedAt: new Date(),
		});

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

	async deleteOne(id: string) {
		const userId = this.cls.get("profile").id;
		const existingTask = await this.findOne(id);

		if (existingTask.createdBy === userId) {
			// throw new NotAllowDelete()
		}

		await this.repo.update(id, {
			isActive: false,
			updatedAt: new Date(),
		});

		return { message: "Task deleted successfully" };
	}
}
