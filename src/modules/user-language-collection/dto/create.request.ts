import { ApiProperty } from "@nestjs/swagger";
import { IsUUID, IsEnum } from "class-validator";
import { ProgrammingLanguageProficiencyLevel } from "@utils";

export class CreateUserLanguageCollectionRequest {
	@ApiProperty({ description: "Supported programming language id" })
	@IsUUID()
	languageId: string;

	@ApiProperty({ enum: ProgrammingLanguageProficiencyLevel })
	@IsEnum(ProgrammingLanguageProficiencyLevel)
	proficiencyLevel: ProgrammingLanguageProficiencyLevel;
}
