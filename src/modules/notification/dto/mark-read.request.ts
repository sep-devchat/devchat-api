import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsUUID, ArrayNotEmpty } from "class-validator";

export class MarkReadManyRequest {
	@ApiProperty({ type: [String] })
	@IsArray()
	@ArrayNotEmpty()
	@IsUUID(undefined, { each: true })
	ids: string[];
}
