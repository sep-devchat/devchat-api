import { ApiProperty } from "@nestjs/swagger";

export class TaskStatisticsByStatus {
	@ApiProperty({ example: 5, description: "Number of TODO tasks" })
	todo: number;

	@ApiProperty({ example: 3, description: "Number of IN_PROGRESS tasks" })
	inProgress: number;

	@ApiProperty({ example: 8, description: "Number of DONE tasks" })
	done: number;
}

export class TaskStatisticsByPriority {
	@ApiProperty({ example: 4, description: "Number of LOW priority tasks" })
	low: number;

	@ApiProperty({ example: 6, description: "Number of MEDIUM priority tasks" })
	medium: number;

	@ApiProperty({ example: 6, description: "Number of HIGH priority tasks" })
	high: number;
}

export class TaskStatisticsResponse {
	@ApiProperty({
		example: 16,
		description: "Total number of tasks in the group",
	})
	totalTasks: number;

	@ApiProperty({
		example: 5,
		description: "Number of pending (TODO + IN_PROGRESS) tasks",
	})
	pendingTasks: number;

	@ApiProperty({ example: 8, description: "Number of completed (DONE) tasks" })
	completedTasks: number;

	@ApiProperty({ example: 3, description: "Number of unassigned tasks" })
	unassignedTasks: number;

	@ApiProperty({
		example: 2,
		description: "Number of overdue tasks (past due date and not done)",
	})
	overdueTasks: number;

	@ApiProperty({
		type: TaskStatisticsByStatus,
		description: "Task count by status",
	})
	byStatus: TaskStatisticsByStatus;

	@ApiProperty({
		type: TaskStatisticsByPriority,
		description: "Task count by priority",
	})
	byPriority: TaskStatisticsByPriority;
}
