import { ApiProperty } from "@nestjs/swagger";

export class AskResponseDto {
	@ApiProperty({ format: "uuid" })
	sessionId: string;

	@ApiProperty({ format: "uuid" })
	interactionId: string;

	@ApiProperty({ description: "AI answer content" })
	answer: string;
}
