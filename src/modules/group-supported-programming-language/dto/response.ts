import { ApiProperty } from "@nestjs/swagger";
import { GroupSupportedProgrammingLanguageEntity } from "@db/entities";

export class GroupSupportedProgrammingLanguageResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	groupId: string;

	@ApiProperty()
	supportedProgrammingLanguageId: string;

	@ApiProperty()
	isActive: boolean;

	static fromEntity(
		entity: GroupSupportedProgrammingLanguageEntity,
	): GroupSupportedProgrammingLanguageResponse {
		const response = new GroupSupportedProgrammingLanguageResponse();
		response.id = entity.id;
		response.groupId = entity.groupId;
		response.supportedProgrammingLanguageId =
			entity.supportedProgrammingLanguageId;
		response.isActive = entity.isActive;
		return response;
	}

	static fromEntities(
		entities: GroupSupportedProgrammingLanguageEntity[],
	): GroupSupportedProgrammingLanguageResponse[] {
		return entities.map((e) => this.fromEntity(e));
	}
}
