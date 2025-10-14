import { MessageEntity } from "@db/entities";
import { Profile } from "@modules/auth/dto";

export class MessageResponse {
	id: string;
	channelId: string;
	threadId: string | null;
	parentMessageId: string | null;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
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
