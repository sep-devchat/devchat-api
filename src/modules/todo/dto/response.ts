import { TodoEntity } from "@db/entities";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TodoPriorityEnum, TodoStatusEnum } from "@utils";

export class TodoResponse {
	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Todo ID",
	})
	id: string;

	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "User ID who owns this todo",
	})
	userId: string;

	@ApiProperty({
		example: "Email to my boss",
		description: "Name of the todo item",
	})
	name: string;

	@ApiPropertyOptional({
		example: "Send a email to my boss at 7.am",
		description: "Description of the todo item",
	})
	description: string | null;

	@ApiProperty({
		example: TodoPriorityEnum.MEDIUM,
		description: "Priority level (0-Low, 1-Medium, 2-High)",
	})
	priority: number;

	@ApiProperty({
		example: TodoStatusEnum.TODO,
		description: "Current status (0-Todo, 1-InProgress, 2-Done)",
	})
	status: number;

	@ApiPropertyOptional({
		example: "2025-12-31T23:59:59.000Z",
		description: "Due date and time for the todo item",
	})
	dueDate: Date | null;

	@ApiProperty({
		example: true,
		description: "Is todo active",
	})
	isActive: boolean;

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

	static fromEntity(entity: TodoEntity): TodoResponse {
		return {
			id: entity.id,
			userId: entity.userId,
			name: entity.name,
			description: entity.description,
			priority: entity.priority,
			status: entity.status,
			dueDate: entity.dueDate,
			isActive: entity.isActive,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}

	static fromEntities(entities: TodoEntity[]): TodoResponse[] {
		return entities.map((entity) => this.fromEntity(entity));
	}
}
