import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class RunCodeCollabRequest {
	@ApiProperty()
	@IsString()
	codeCollabId: string;
}
