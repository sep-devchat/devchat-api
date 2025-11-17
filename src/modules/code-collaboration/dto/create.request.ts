import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateCodeCollaborationRequest {
	@ApiProperty()
	@IsString()
	codeBlockId: string;

	@ApiProperty()
	@IsString()
	content: string;
}
