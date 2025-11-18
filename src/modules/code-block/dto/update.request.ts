import { IsString, IsOptional, IsNumber, IsDate } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateCodeBlockRequest {
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
}
