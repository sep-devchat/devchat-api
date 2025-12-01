import { ThreadMessageEntity } from "@db/entities";
import { Profile } from "@modules/auth/dto";

export class ThreadMessageResponse {
	id: string;
	threadId: string;
	channelId: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	sender?: Profile;
	codeBlockId?: string | null;
	parentMessageId?: string | null;
	parentMessage?: ThreadMessageResponse | null;

	static fromEntity(entity: ThreadMessageEntity): ThreadMessageResponse {
		return {
			id: entity.id,
			threadId: entity.threadId,
			channelId: entity.channelId,
			content: entity.content,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			sender: entity.sender ? Profile.fromEntity(entity.sender) : undefined,
			codeBlockId: entity.codeBlockId,
			parentMessageId: entity.parentMessageId,
			parentMessage: entity.parentMessage
				? this.fromEntity(entity.parentMessage)
				: null,
		};
	}

	static fromEntities(
		entities: ThreadMessageEntity[],
	): ThreadMessageResponse[] {
		return entities.map((e) => this.fromEntity(e));
	}
}
