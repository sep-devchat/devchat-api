import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class SearchDirectMessagesRequest {
	@ApiProperty({
		description: "Target user ID for the direct conversation",
		example: "4c2f8a6d-12ab-4f3e-9d77-d5c1f0e9b123",
	})
	@IsString()
	targetUserId: string;

	@ApiProperty({ description: "Search query text", example: "refactor" })
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
