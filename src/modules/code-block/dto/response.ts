import { CodeBlockEntity } from "@db/entities";
import { UserResponse } from "@modules/user/dto";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CodeBlockResponse {
	@ApiProperty({
		description: "The unique identifier of the code block.",
		example: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
	})
	id: string;

	@ApiProperty({
		description: "The ID of the user who owns the code block.",
		example: "f8c3de3d-1fea-4d7c-a8b0-29f63c4c3451",
	})
	userId: string;

	@ApiProperty({
		description: "The programming language.",
		example: "javascript",
	})
	language: string;

	@ApiProperty({
		description: "The code content.",
		example: "const fact = (n) => n <= 1 ? 1 : n * fact(n - 1);",
	})
	content: string;

	@ApiProperty({ description: "The date and time the code block was created." })
	createdAt: Date;

	@ApiProperty({
		description: "The date and time the code block was last updated.",
	})
	updatedAt: Date;

	@ApiPropertyOptional({
		type: () => UserResponse,
		description: "User who this code block belongs to",
	})
	user: UserResponse;

	static fromEntity(entity: CodeBlockEntity): CodeBlockResponse {
		return {
			id: entity.id,
			userId: entity.userId,
			language: entity.language,
			content: entity.content,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			user: entity.user ? UserResponse.fromEntity(entity.user) : undefined,
		};
	}

	static fromEntities(entities: CodeBlockEntity[]): CodeBlockResponse[] {
		return entities.map((entity) => this.fromEntity(entity));
	}
}
