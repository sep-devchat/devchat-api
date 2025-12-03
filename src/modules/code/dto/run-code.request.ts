import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RunCodeRequest {
	@ApiProperty()
	@IsString()
	language: string;

	@ApiProperty({
		example: "console.log('Hello, World!');",
		description: "The code to be executed. Max length: 1000",
	})
	@IsString()
	@MaxLength(1000)
	@IsNotEmpty()
	code: string;
}
