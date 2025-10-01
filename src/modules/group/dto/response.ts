import { GroupEntity } from "@db/entities";
import { ApiProperty, ApiResponse } from "@nestjs/swagger";

export class GroupResponse {
	@ApiProperty({
		example: "550e8400-e29b-41d4-a716-446655440000",
		description: "Group ID",
	})
	id: string;

	@ApiProperty({ example: "Developers", description: "Group name" })
	name: string;

	@ApiProperty({
		example: "A group for all developers.",
		description: "Group description",
		nullable: true,
	})
	description: string;

	@ApiProperty({
		example: "https://cdn.example.com/groups/developers.png",
		description: "Group avatar URL",
		nullable: true,
	})
	avatar: string;

	@ApiProperty({
		example: "550e8400-e29b-41d4-a716-446655440000",
		description: "ID of the user who created the group",
	})
	createdBy: string;

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

	@ApiProperty({ example: true, description: "Is group active" })
	isActive: boolean;

	static fromEntity(entity: GroupEntity): GroupResponse {
		return {
			id: entity.id,
			name: entity.name,
			description: entity.description,
			avatar: entity.avatar,
			createdBy: entity.createdBy,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			isActive: entity.isActive,
		};
	}

	static fromEntities(entities: GroupEntity[]): GroupResponse[] {
		return entities.map((entity) => this.fromEntity(entity));
	}
}
