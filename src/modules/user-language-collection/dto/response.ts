import { UserLanguageCollectionEntity } from "@db/entities/user-language-collection.entity";
import { ProgrammingLanguageResponse } from "@modules/programming-language/dto";
import { ApiProperty } from "@nestjs/swagger";
import { ProgrammingLanguageProficiencyLevel } from "@utils";

class EmbeddedLanguageResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	languageCode: string;

	@ApiProperty()
	languageName: string;

	@ApiProperty({ required: false })
	languageVersion?: string | null;

	static fromEntity(
		entity: UserLanguageCollectionEntity["language"],
	): EmbeddedLanguageResponse {
		const response = new EmbeddedLanguageResponse();
		response.id = entity.id;
		response.languageCode = entity.languageCode;
		response.languageName = entity.languageName;
		response.languageVersion = entity.languageVersion;
		return response;
	}
}

export class UserLanguageCollectionResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	userId: string;

	@ApiProperty()
	languageId: string;

	@ApiProperty({ enum: ProgrammingLanguageProficiencyLevel })
	proficiencyLevel: ProgrammingLanguageProficiencyLevel;

	@ApiProperty()
	orderIndex: number;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	@ApiProperty({ type: () => ProgrammingLanguageResponse, required: false })
	language?: ProgrammingLanguageResponse;

	static fromEntity(
		entity: UserLanguageCollectionEntity,
	): UserLanguageCollectionResponse {
		const response = new UserLanguageCollectionResponse();
		response.id = entity.id;
		response.userId = entity.userId;
		response.languageId = entity.languageId;
		response.proficiencyLevel = entity.proficiencyLevel;
		response.orderIndex = entity.orderIndex;
		response.createdAt = entity.createdAt;
		response.updatedAt = entity.updatedAt;
		response.language = ProgrammingLanguageResponse.fromEntity(entity.language);
		return response;
	}
}
