import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SearchMessagesRequest {
	@ApiProperty({
		description: "Target channel ID",
		example: "9f3c1a2b-0a55-4d1c-ae5c-2f5d1f1e9a21",
	})
	@IsString()
	channelId: string;

	@ApiProperty({ description: "Search query text", example: "error handling" })
	@IsString()
	@MinLength(1)
	q: string;

	@ApiProperty({
		description: "Page number (1-based)",
		required: false,
		example: 1,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	page?: number;

	@ApiProperty({
		description: "Items per page (max 100)",
		required: false,
		example: 50,
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	take?: number;
}
