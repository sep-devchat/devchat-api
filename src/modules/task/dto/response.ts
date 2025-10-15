import { TaskEntity } from "@db/entities";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TaskPriorityEnum, TaskStatusEnum } from "@utils";
import { UserResponse } from "@modules/user/dto";
import { GroupResponse } from "@modules/group/dto";

export class TaskResponse {
	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Task ID",
	})
	id: string;

	@ApiPropertyOptional({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "ID of the user assigned to this task",
	})
	assigneeId: string | null;

	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "ID of the group this task belongs to",
	})
	groupId: string;

	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "ID of the user who created this task",
	})
	createdBy: string;

	@ApiProperty({
		example: "Implement user authentication",
		description: "Name of the task",
	})
	name: string;

	@ApiPropertyOptional({
		example: "Create login/register functionality with JWT tokens",
		description: "Description of the task",
	})
	description: string | null;

	@ApiProperty({
		example: TaskStatusEnum.TODO,
		description: "Current status (0-Todo, 1-InProgress, 2-Done)",
	})
	status: number;

	@ApiProperty({
		example: TaskPriorityEnum.HIGH,
		description: "Priority level (0-Low, 1-Medium, 2-High)",
	})
	priority: number;

	@ApiPropertyOptional({
		example: "2025-12-31T23:59:59.000Z",
		description: "Due date and time for the task",
	})
	dueDate: Date | null;

	@ApiPropertyOptional({
		type: () => UserResponse,
		description: "User assigned to this task",
	})
	assignee: UserResponse | null;

	@ApiProperty({
		type: () => UserResponse,
		description: "User who created this task",
	})
	creator: UserResponse;

	@ApiProperty({
		type: () => GroupResponse,
		description: "Group this task belongs to",
	})
	group: GroupResponse;

	@ApiProperty({
		example: "2024-01-01T00:00:00.000Z",
		description: "Creation date",
	})
	createdAt: Date;

	@ApiProperty({
		example: "2024-01-01T00:00:00.000Z",
		description: "Last update date",
	})
	updatedAt: Date;

	@ApiProperty({
		example: true,
		description: "Is task active",
	})
	isActive: boolean;

	static fromEntity(entity: TaskEntity): TaskResponse {
		return {
			id: entity.id,
			assigneeId: entity.assigneeId,
			groupId: entity.groupId,
			createdBy: entity.createdBy,
			name: entity.name,
			description: entity.description,
			status: entity.status,
			priority: entity.priority,
			dueDate: entity.dueDate,
			assignee: entity.assignee
				? UserResponse.fromEntity(entity.assignee)
				: null,
			creator: UserResponse.fromEntity(entity.creator),
			group: GroupResponse.fromEntity(entity.group),
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			isActive: entity.isActive,
		};
	}

	static fromEntities(entities: TaskEntity[]): TaskResponse[] {
		return entities.map((entity) => this.fromEntity(entity));
	}
}
