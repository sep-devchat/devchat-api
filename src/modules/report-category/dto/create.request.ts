import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateReportCategoryRequest {
	@ApiProperty({ description: "Category display name", maxLength: 100 })
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	name: string;

	@ApiProperty({ description: "Category description", maxLength: 2000 })
	@IsString()
	@IsNotEmpty()
	@MaxLength(2000)
	description: string;
}
