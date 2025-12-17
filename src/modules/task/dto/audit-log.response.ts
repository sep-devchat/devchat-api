import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TaskHistoryEntity } from "@db/entities";

export class AuditLogResponse {
	@ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
	id: string;

	@ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
	userId: string;

	@ApiProperty({ example: "create" })
	action: string;

	@ApiProperty({ example: "Task" })
	entityType: string;

	@ApiPropertyOptional({ example: "status: To Do -> In Progress" })
	oldValues: string | null;

	@ApiPropertyOptional({ example: "status: To Do -> In Progress" })
	newValues: string | null;

	@ApiProperty({ example: "2024-12-13T10:30:00.000Z" })
	timestamp: string;

	@ApiProperty({ example: "John Doe" })
	userName: string;

	static fromTaskHistory(entity: TaskHistoryEntity): AuditLogResponse {
		const userName = entity.user
			? entity.user.username || entity.user.email || "Unknown User"
			: "Unknown User";

		// Build a description of the change
		let changeDescription = "";
		if (entity.fieldName) {
			changeDescription = `${entity.fieldName}`;
			if (entity.oldValue && entity.newValue) {
				changeDescription += `: ${entity.oldValue} -> ${entity.newValue}`;
			} else if (entity.newValue) {
				changeDescription += `: ${entity.newValue}`;
			} else if (entity.oldValue) {
				changeDescription += `: ${entity.oldValue}`;
			}
		}

		return {
			id: entity.id,
			userId: entity.userId,
			action: entity.action,
			entityType: "Task",
			oldValues: entity.oldValue,
			newValues: entity.newValue,
			timestamp: entity.createdAt.toISOString(),
			userName: userName,
		};
	}

	static fromTaskHistories(entities: TaskHistoryEntity[]): AuditLogResponse[] {
		// Group by timestamp and action to combine field changes
		const grouped = new Map<
			string,
			{
				entity: TaskHistoryEntity;
				changes: Map<string, { old: string | null; new: string | null }>;
			}
		>();

		for (const entity of entities) {
			const key = `${entity.createdAt.toISOString()}_${entity.action}`;
			if (!grouped.has(key)) {
				grouped.set(key, {
					entity,
					changes: new Map(),
				});
			}
			const group = grouped.get(key)!;
			if (entity.fieldName) {
				group.changes.set(entity.fieldName, {
					old: entity.oldValue,
					new: entity.newValue,
				});
			}
		}

		return Array.from(grouped.values()).map(({ entity, changes }) => {
			const userName = entity.user
				? entity.user.username || entity.user.email || "Unknown User"
				: "Unknown User";

			// Build combined changes object
			const oldValuesObj: Record<string, any> = {};
			const newValuesObj: Record<string, any> = {};

			for (const [field, { old, new: newVal }] of changes.entries()) {
				if (old) oldValuesObj[field] = old;
				if (newVal) newValuesObj[field] = newVal;
			}

			return {
				id: entity.id,
				userId: entity.userId,
				action: entity.action,
				entityType: "Task",
				oldValues:
					Object.keys(oldValuesObj).length > 0
						? JSON.stringify(oldValuesObj)
						: null,
				newValues:
					Object.keys(newValuesObj).length > 0
						? JSON.stringify(newValuesObj)
						: null,
				timestamp: entity.createdAt.toISOString(),
				userName: userName,
			};
		});
	}
}
