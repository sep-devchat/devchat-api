import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TaskPriorityEnum, TaskStatusEnum } from "@utils";
import { Transform, Type } from "class-transformer";
import {
	IsNumber,
	Min,
	Max,
	IsString,
	IsOptional,
	IsEnum,
	IsDate,
} from "class-validator";

const toNumberArray = (value: unknown): number[] | undefined => {
	if (value === undefined || value === null || value === "") {
		return undefined;
	}

	const raw = Array.isArray(value)
		? value
		: String(value)
				.split(",")
				.map((chunk) => chunk.trim())
				.filter(Boolean);

	const parsed = raw
		.map((entry) => {
			const intValue = Number(entry);
			return Number.isNaN(intValue) ? null : intValue;
		})
		.filter((entry): entry is number => entry !== null);

	return parsed.length ? parsed : undefined;
};

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
		example: [TaskStatusEnum.TODO, TaskStatusEnum.DONE],
		enum: TaskStatusEnum,
		description:
			"Filter by task status (accepts comma-separated or repeated params)",
		isArray: true,
	})
	@IsEnum(TaskStatusEnum, { each: true })
	@IsOptional()
	@Transform(({ value }) => toNumberArray(value))
	status?: TaskStatusEnum[];

	@ApiPropertyOptional({
		example: [TaskPriorityEnum.HIGH, TaskPriorityEnum.LOW],
		enum: TaskPriorityEnum,
		description:
			"Filter by task priority (accepts comma-separated or repeated params)",
		isArray: true,
	})
	@IsEnum(TaskPriorityEnum, { each: true })
	@IsOptional()
	@Transform(({ value }) => toNumberArray(value))
	priority?: TaskPriorityEnum[];

	@ApiPropertyOptional({
		example: "authentication",
		description: "Search tasks by name or description",
	})
	@IsString()
	@IsOptional()
	search?: string;

	@ApiPropertyOptional({
		example: false,
		description: "Include tasks without assignee",
	})
	@IsOptional()
	@Type(() => Boolean)
	unassigned?: boolean;

	@ApiPropertyOptional({
		example: "2024-01-01T00:00:00.000Z",
		description: "Filter tasks with start date from this date",
	})
	@IsOptional()
	@IsString()
	startDateFrom?: string;

	@ApiPropertyOptional({
		example: "2024-12-31T23:59:59.999Z",
		description: "Filter tasks with start date until this date",
	})
	@IsOptional()
	@IsString()
	startDateTo?: string;

	@ApiPropertyOptional({
		example: "2024-01-01T00:00:00.000Z",
		description: "Filter tasks with due date from this date",
	})
	@IsOptional()
	@IsString()
	dueDateFrom?: string;

	@ApiPropertyOptional({
		example: "2024-12-31T23:59:59.999Z",
		description: "Filter tasks with due date until this date",
	})
	@IsOptional()
	@IsString()
	dueDateTo?: string;
}
