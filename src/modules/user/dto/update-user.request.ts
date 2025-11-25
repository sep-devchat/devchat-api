import { ApiProperty, PartialType } from "@nestjs/swagger";
import { CreateUserRequest } from "./create-user.request";
import {
	IsArray,
	IsEnum,
	IsInt,
	IsOptional,
	IsUUID,
	Min,
	ValidateNested,
} from "class-validator";
import { ProgrammingLanguageProficiencyLevel } from "@utils";
import { Type } from "class-transformer";

export class UserLanguageUpdateItem {
	@ApiProperty({ description: "Supported programming language id" })
	@IsUUID()
	languageId: string;

	@ApiProperty({ enum: ProgrammingLanguageProficiencyLevel })
	@IsEnum(ProgrammingLanguageProficiencyLevel)
	proficiencyLevel: ProgrammingLanguageProficiencyLevel;

	@ApiProperty({ required: false, minimum: 1 })
	@IsOptional()
	@IsInt()
	@Min(1)
	orderIndex?: number;
}

export class UpdateUserRequest extends PartialType(CreateUserRequest) {
	@ApiProperty({
		description: "Ordered list of programming languages for the user profile",
		required: false,
		type: [UserLanguageUpdateItem],
	})
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UserLanguageUpdateItem)
	userLanguages?: UserLanguageUpdateItem[];
}
