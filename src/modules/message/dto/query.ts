import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class MessageQuery {
	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	threadId?: string;
}
