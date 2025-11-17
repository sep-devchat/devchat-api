import { CodeCollaborationEntity } from "@db/entities";
import { Profile } from "@modules/auth/dto";
import { ApiProperty } from "@nestjs/swagger";

export class CodeCollaborationResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	content: string;

	@ApiProperty({ type: Profile })
	createdBy: Profile;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	static fromEntity(
		entity: CodeCollaborationEntity,
	): CodeCollaborationResponse {
		return {
			id: entity.id,
			content: entity.content,
			createdBy: Profile.fromEntity(entity.createdBy),
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}

	static fromEntities(
		entities: CodeCollaborationEntity[],
	): CodeCollaborationResponse[] {
		return entities.map((entity) => this.fromEntity(entity));
	}
}
