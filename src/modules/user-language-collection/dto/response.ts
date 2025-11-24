import { ApiProperty } from "@nestjs/swagger";
import { ProgrammingLanguageProficiencyLevel } from "@utils";

class EmbeddedLanguageResponse {
	@ApiProperty() id: string;
	@ApiProperty() languageCode: string;
	@ApiProperty() languageName: string;
	@ApiProperty({ required: false }) languageVersion?: string | null;
}

export class UserLanguageCollectionResponse {
	@ApiProperty() id: string;
	@ApiProperty() userId: string;
	@ApiProperty() languageId: string;
	@ApiProperty({ enum: ProgrammingLanguageProficiencyLevel })
	proficiencyLevel: ProgrammingLanguageProficiencyLevel;
	@ApiProperty() createdAt: Date;
	@ApiProperty() updatedAt: Date;
	@ApiProperty({ type: () => EmbeddedLanguageResponse, required: false })
	language?: EmbeddedLanguageResponse;
}
