import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, Length } from "class-validator";

export class CreateProgrammingLanguageRequest {
	@ApiProperty({
		description: "Short unique code for the language (e.g. 'py', 'js')",
	})
	@IsString()
	@Length(1, 50)
	languageCode: string;

	@ApiProperty({
		description: "Language display name (e.g. 'Python', 'JavaScript')",
	})
	@IsString()
	@Length(1, 100)
	languageName: string;

	@ApiProperty({
		description: "Optional version identifier (e.g. '3.12')",
		required: false,
	})
	@IsOptional()
	@IsString()
	@Length(1, 50)
	languageVersion?: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	preset?: string;

	@ApiProperty({
		description:
			"Optional icon URL or base64 string for the programming language",
		required: false,
	})
	@IsOptional()
	@IsString()
	languageIcon?: string;

	@ApiProperty({
		description: "Indicates if the language supports code execution",
		required: false,
	})
	@IsOptional()
	isExecutable?: boolean;
}
