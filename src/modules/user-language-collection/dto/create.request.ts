import { ApiProperty } from "@nestjs/swagger";
import { IsUUID, IsEnum, IsOptional } from "class-validator";
import { ProgrammingLanguageProficiencyLevel } from "@utils";

export class CreateUserLanguageCollectionRequest {
	@ApiProperty({ description: "User id owning this language entry" })
	@IsUUID()
	userId: string;

	@ApiProperty({ description: "Supported programming language id" })
	@IsUUID()
	languageId: string;

	@ApiProperty({ enum: ProgrammingLanguageProficiencyLevel })
	@IsEnum(ProgrammingLanguageProficiencyLevel)
	proficiencyLevel: ProgrammingLanguageProficiencyLevel;
}
