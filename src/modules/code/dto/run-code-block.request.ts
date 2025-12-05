import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class RunCodeBlockRequest {
	@ApiProperty()
	@IsString()
	codeBlockId: string;
}
