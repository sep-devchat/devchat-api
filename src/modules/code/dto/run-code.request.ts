import { ApiProperty } from "@nestjs/swagger";
import { ProgrammingLanguageEnum } from "@utils";
import { IsEnum, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RunCodeRequest {
	@ApiProperty({
		type: String,
		enum: ProgrammingLanguageEnum,
		example: "javascript",
		description: "The programming language of the code",
	})
	@IsEnum(ProgrammingLanguageEnum)
	language: ProgrammingLanguageEnum;

	@ApiProperty({
		example: "console.log('Hello, World!');",
		description: "The code to be executed. Max length: 1000",
	})
	@IsString()
	@MaxLength(1000)
	@IsNotEmpty()
	code: string;
}
