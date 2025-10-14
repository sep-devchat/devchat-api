import { MessageEntity } from "@db/entities";
import { Profile } from "@modules/auth/dto";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class MessageResponse {
	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Message ID",
	})
	id: string;

	@ApiProperty({
		example: "111e2222-e33b-44d3-a555-666614174000",
		description: "Channel ID the message belongs to",
	})
	channelId: string;

	@ApiPropertyOptional({
		example: "aaaabbbb-cccc-dddd-eeee-ffffffffffff",
		description: "Thread ID if the message is part of a thread",
	})
	threadId: string | null;

	@ApiPropertyOptional({
		example: "999e0000-e11b-22d3-a333-444414174000",
		description: "Parent message ID if this is a reply",
	})
	parentMessageId: string | null;

	@ApiProperty({
		example: "Hello world!",
		description: "Message content",
	})
	content: string;

	@ApiProperty({
		example: "2024-01-01T00:00:00.000Z",
		description: "Creation timestamp",
	})
	createdAt: Date;

	@ApiProperty({
		example: "2024-01-01T00:10:00.000Z",
		description: "Last update timestamp",
	})
	updatedAt: Date;

	@ApiPropertyOptional({
		example: null,
		description: "Soft deletion timestamp, if deleted",
	})
	deletedAt: Date | null;

	@ApiProperty()
	sender: Profile;

	static fromEntity(entity: MessageEntity): MessageResponse {
		return {
			id: entity.id,
			channelId: entity.channelId,
			threadId: entity.threadId,
			parentMessageId: entity.parentMessageId,
			content: entity.content,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			deletedAt: entity.deletedAt,
			sender: Profile.fromEntity(entity.sender),
		};
	}

	static fromEntities(entities: MessageEntity[]): MessageResponse[] {
		return entities.map((e) => this.fromEntity(e));
	}
}
