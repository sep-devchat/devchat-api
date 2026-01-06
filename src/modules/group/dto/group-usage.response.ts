import { GroupUsageEntity } from "@db/entities";
import { ApiProperty } from "@nestjs/swagger";

export class GroupUsageResponse {
	@ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
	id: string;

	@ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
	groupId: string;

	@ApiProperty({ example: "2026-01" })
	billingCycleKey: string;

	@ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
	periodStart: Date;

	@ApiProperty({ example: "2026-02-01T00:00:00.000Z" })
	periodEnd: Date;

	@ApiProperty({ example: 0 })
	messagesSent: number;

	@ApiProperty({ example: "0" })
	fileBytesUploaded: string;

	@ApiProperty({ example: 0 })
	runCodeExecutions: number;

	@ApiProperty({ example: "0" })
	aiTokensConsumed: string;

	@ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
	createdAt: Date;

	@ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
	updatedAt: Date;

	static fromEntity(entity: GroupUsageEntity): GroupUsageResponse {
		return {
			id: entity.id,
			groupId: entity.groupId,
			billingCycleKey: entity.billingCycleKey,
			periodStart: entity.periodStart,
			periodEnd: entity.periodEnd,
			messagesSent: entity.messagesSent,
			fileBytesUploaded: entity.fileBytesUploaded,
			runCodeExecutions: entity.runCodeExecutions,
			aiTokensConsumed: entity.aiTokensConsumed,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}
}
