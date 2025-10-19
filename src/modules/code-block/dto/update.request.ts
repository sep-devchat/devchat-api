import { IsString, IsOptional, IsNumber, IsDate } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateCodeBlockRequest {
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

	@ApiPropertyOptional({
		description: "Programming language of the code block",
		example: "python",
	})
	@IsString()
	@IsOptional()
	language?: string;

	@ApiPropertyOptional({
		description: "Actual code content",
		example: "def quick_sort(arr): ...",
	})
	@IsString()
	@IsOptional()
	content?: string;

	@ApiPropertyOptional({
		description: "The result of code execution",
	})
	@IsString()
	@IsOptional()
	executionResult?: string;

	@ApiPropertyOptional({
		description: "The status of code execution",
	})
	@IsNumber()
	@IsOptional()
	executionStatus?: number;

	@ApiPropertyOptional({
		description: "The date and time the code was executed",
	})
	@IsDate()
	@IsOptional()
	executedAt?: Date;
}
