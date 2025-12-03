import { SupportedProgrammingLanguageEntity } from "@db/entities/supported-programming-language.entity";
import { ApiProperty } from "@nestjs/swagger";

export class ProgrammingLanguageResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	languageCode: string;

	@ApiProperty()
	languageName: string;

	@ApiProperty({ required: false })
	languageVersion?: string | null;

	@ApiProperty({ required: false })
	languageIcon?: string | null;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date;

	@ApiProperty()
	isExecutable: boolean;

	@ApiProperty()
	preset: string;

	@ApiProperty()
	isActive: boolean;

	static fromEntity(
		entity: SupportedProgrammingLanguageEntity,
	): ProgrammingLanguageResponse {
		return {
			id: entity.id,
			languageCode: entity.languageCode,
			languageName: entity.languageName,
			languageVersion: entity.languageVersion,
			languageIcon: entity.languageIcon,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			isExecutable: entity.isExecutable,
			preset: entity.preset,
			isActive: entity.isActive,
		};
	}

	static fromEntities(
		entities: SupportedProgrammingLanguageEntity[],
	): ProgrammingLanguageResponse[] {
		return entities.map((entity) => this.fromEntity(entity));
	}
}
