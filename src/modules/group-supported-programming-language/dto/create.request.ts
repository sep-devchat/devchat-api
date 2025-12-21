import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class AddGroupSupportedProgrammingLanguageRequest {
	@ApiProperty({ description: "Supported programming language id" })
	@IsUUID()
	languageId: string;
}
