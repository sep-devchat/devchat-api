import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateThreadRequest {
	@ApiProperty()
	messageId: string;
}
