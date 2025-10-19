import { IsString, IsOptional, IsNotEmpty, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ProgrammingLanguageEnum } from "@modules/code/code.enums";

export class CreateCodeBlockRequest {
	@ApiPropertyOptional({
		description: "Title of the code block",
		example: "Quick Sort Implementation",
	})
	@IsString()
	@IsOptional()
	title?: string;

	@ApiPropertyOptional({
		description: "Description of the code block",
		example: "This code block demonstrates the quick sort algorithm.",
	})
	@IsString()
	@IsOptional()
	description?: string;

	@ApiProperty({
		description: "Programming language of the code block",
		example: "python",
	})
	@IsString()
	@IsNotEmpty()
	language: string;

	@ApiProperty({
		description: "Actual code content",
		example: "def quick_sort(arr): ...",
	})
	@IsString()
	@IsNotEmpty()
	content: string;
}
