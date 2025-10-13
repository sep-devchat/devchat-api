import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TaskPriorityEnum, TaskStatusEnum } from "@utils";
import { Type } from "class-transformer";
import {
	IsNumber,
	Min,
	Max,
	IsString,
	IsOptional,
	IsEnum,
} from "class-validator";

export class TaskQuery {
	@ApiProperty({ required: true })
	@IsNumber()
	@Min(1)
	@Type(() => Number)
	page: number;

	@ApiProperty({ required: true })
	@IsNumber()
	@Min(1)
	@Max(100)
	@Type(() => Number)
	limit: number;

	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	assigneeId: string;

	@ApiPropertyOptional({
		example: TaskStatusEnum.TODO,
		enum: TaskStatusEnum,
		description: "Filter by task status (0-Todo, 1-InProgress, 2-Done)",
	})
	@IsEnum(TaskStatusEnum)
	@IsOptional()
	@Type(() => Number)
	status?: TaskStatusEnum;

	@ApiPropertyOptional({
		example: TaskPriorityEnum.HIGH,
		enum: TaskPriorityEnum,
		description: "Filter by task priority (0-Low, 1-Medium, 2-High)",
	})
	@IsEnum(TaskPriorityEnum)
	@IsOptional()
	@Type(() => Number)
	priority?: TaskPriorityEnum;

	@ApiPropertyOptional({
		example: "authentication",
		description: "Search tasks by name or description",
	})
	@IsString()
	@IsOptional()
	search?: string;

	@ApiPropertyOptional({
		example: true,
		description: "Filter overdue tasks (past due date)",
	})
	@IsOptional()
	@Type(() => Boolean)
	overdue?: boolean;

	@ApiPropertyOptional({
		example: false,
		description: "Include tasks without assignee",
	})
	@IsOptional()
	@Type(() => Boolean)
	unassigned?: boolean;
}
