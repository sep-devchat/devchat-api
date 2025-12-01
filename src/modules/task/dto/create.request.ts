import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TaskPriorityEnum, TaskStatusEnum } from "@utils";
import { Transform } from "class-transformer";
import {
	IsDate,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Length,
	Max,
	Min,
} from "class-validator";

export class CreateTaskRequest {
	@ApiProperty({
		example: "Implement user authentication",
		description: "Name of the task",
	})
	@IsString()
	@Length(1, 255)
	name: string;

	@ApiPropertyOptional({
		example: "Create login/register functionality with JWT tokens",
		description: "Description of the task",
	})
	@IsString()
	@IsOptional()
	description: string | null;

	@ApiProperty({
		example: TaskPriorityEnum.HIGH,
		description: "Priority level (0-Low, 1-Medium, 2-High)",
	})
	@IsNumber()
	@Min(0)
	@Max(2)
	priority: number;

	@ApiProperty({
		example: TaskStatusEnum.TODO,
		description: "Current status (0-Todo, 1-InProgress, 2-Done)",
	})
	@IsNumber()
	@Min(0)
	@Max(2)
	status: number;

	@ApiPropertyOptional({
		example: "2025-12-31T23:59:59.000Z",
		description: "Due date and time for the task",
	})
	@IsOptional()
	@Transform(({ value }) => (value ? new Date(value) : null))
	@IsDate()
	startDate: Date | null;

	@ApiPropertyOptional({
		example: "2025-12-31T23:59:59.000Z",
		description: "Due date and time for the task",
	})
	@IsOptional()
	@Transform(({ value }) => (value ? new Date(value) : null))
	@IsDate()
	dueDate: Date | null;

	@ApiPropertyOptional({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "ID of the user assigned to this task",
	})
	@IsOptional()
	@IsString()
	@IsUUID()
	assigneeId?: string;
}
