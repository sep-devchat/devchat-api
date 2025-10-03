import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateThreadRequest {
	@ApiProperty({ maxLength: 200, required: true, example: "Sprint 42" })
	@IsString()
	@MaxLength(200)
	@IsNotEmpty()
	name: string;

	@ApiProperty({
		required: false,
		example: "Discussion for sprint 42 planning.",
	})
	@IsString()
	@IsOptional()
	@MaxLength(255)
	description?: string | null;
}
