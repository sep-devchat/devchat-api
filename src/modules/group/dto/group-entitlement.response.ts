import { GroupEntitlementEntity } from "@db/entities";
import { ApiProperty } from "@nestjs/swagger";

export class GroupEntitlementResponse {
	@ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
	id: string;

	@ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
	groupId: string;

	@ApiProperty({ example: "migration", maxLength: 30 })
	source: string;

	@ApiProperty({
		required: false,
		nullable: true,
		example: "550e8400-e29b-41d4-a716-446655440000",
	})
	subscriptionId: string | null;

	@ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
	effectiveFrom: Date;

	@ApiProperty({ required: false, nullable: true, example: null })
	effectiveTo: Date | null;

	@ApiProperty({
		type: Object,
		additionalProperties: true,
	})
	entitlements: Record<string, any>;

	@ApiProperty({ example: "2026-01-01T00:00:00.000Z" })
	createdAt: Date;

	@ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
	createdBy: string;

	static fromEntity(entity: GroupEntitlementEntity): GroupEntitlementResponse {
		return {
			id: entity.id,
			groupId: entity.groupId,
			source: entity.source,
			subscriptionId: entity.subscriptionId,
			effectiveFrom: entity.effectiveFrom,
			effectiveTo: entity.effectiveTo,
			entitlements: entity.entitlements,
			createdAt: entity.createdAt,
			createdBy: entity.createdBy,
		};
	}
}
