import { ApiProperty } from "@nestjs/swagger";
import { TaskStatusEnum } from "@utils";
import { IsNumber, Max, Min } from "class-validator";

export class UpdateTaskStatusRequest {
	@ApiProperty({
		example: TaskStatusEnum.IN_PROGRESS,
		description: "Current status (0-Todo, 1-InProgress, 2-Done)",
	})
	@IsNumber()
	@Min(0)
	@Max(2)
	status: number;
}
