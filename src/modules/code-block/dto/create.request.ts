import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCodeBlockRequest {
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
