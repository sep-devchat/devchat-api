import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateGroupRequest {
	@ApiProperty({ maxLength: 200, required: true, example: "Developers" })
	@IsString()
	@MaxLength(200)
	@IsNotEmpty()
	name: string;

	@ApiProperty({ required: false, example: "A group for all developers." })
	@IsString()
	@IsOptional()
	description?: string | null;

	@ApiProperty({
		required: false,
		example: "https://cdn.example.com/groups/developers.png",
	})
	@IsString()
	@IsOptional()
	avatar?: string | null;
}
