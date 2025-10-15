import { ApiProperty } from "@nestjs/swagger";
import { TodoPriorityEnum, TodoStatusEnum } from "@utils";
import { Transform } from "class-transformer";
import {
	IsDate,
	IsNumber,
	IsOptional,
	IsString,
	Length,
	Max,
	Min,
	MIN,
} from "class-validator";

export class CreateTodoRequest {
	@ApiProperty({
		example: "Email to my boss",
		description: "Name of the todo item",
		required: true,
	})
	@IsString()
	@Length(1, 255)
	name: string;

	@ApiProperty({
		example: "Send a email to my boss at 7.am",
		description: "The description of todo item",
		required: false,
	})
	@IsString()
	@IsOptional()
	description: string | null;

	@ApiProperty({
		example: TodoPriorityEnum.MEDIUM,
		description: "The priority of the todo item (0-Low, 1-Medium, 2-High)",
	})
	@IsNumber()
	@Min(0)
	@Max(2)
	priority: number;

	@ApiProperty({
		example: TodoStatusEnum.TODO,
		description: "The status of the todo item (0-Todo, 1-InProgress, 2-Done)",
	})
	@Min(0)
	@Max(2)
	status: number;

	@ApiProperty({
		example: "2025-12-31T23:59:59.000Z",
		description:
			"The due date and time for the todo item. Can be null if no deadline is set.",
	})
	@Transform(({ value }) => (value ? new Date(value) : null))
	@IsDate()
	dueDate: Date | null;
}
