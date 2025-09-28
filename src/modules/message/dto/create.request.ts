import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CreateMessageRequest {
	@ApiProperty()
	@IsString()
	channelId: string;

	@ApiProperty()
	@IsString()
	@IsOptional()
	threadId?: string;

	@ApiProperty()
	@IsString()
	@IsOptional()
	parentMessageId?: string;

	@ApiProperty()
	@IsString()
	content: string;
}
