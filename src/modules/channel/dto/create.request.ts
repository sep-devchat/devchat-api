import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateChannelRequest {
	@ApiProperty({ maxLength: 200, required: true, example: "general" })
	@IsString()
	@MaxLength(200)
	@IsNotEmpty()
	name: string;

	@ApiProperty({ required: false, example: "Channel for general discussions." })
	@IsString()
	@IsOptional()
	@MaxLength(255)
	description?: string | null;
}
