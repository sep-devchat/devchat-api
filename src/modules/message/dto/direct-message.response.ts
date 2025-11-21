import { DirectMessageEntity } from "@db/entities";
import { Profile } from "@modules/auth/dto";

export class DirectMessageResponse {
	id: string;
	from: Profile | null;
	to: Profile | null;
	content: string;
	parentMessageId: string | null;
	parentMessage: DirectMessageResponse | null;
	codeBlockId?: string;
	createdAt: Date;
	updatedAt: Date;

	static fromEntity(entity: DirectMessageEntity): DirectMessageResponse {
		return {
			id: entity.id,
			from: entity.fromUser ? Profile.fromEntity(entity.fromUser) : null,
			to: entity.toUser ? Profile.fromEntity(entity.toUser) : null,
			content: entity.content,
			parentMessageId: entity.parentMessageId,
			parentMessage: entity.parentMessage
				? this.fromEntity(entity.parentMessage)
				: null,
			codeBlockId: entity.codeBlockId ?? undefined,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}

	static fromEntities(
		entities: DirectMessageEntity[],
	): DirectMessageResponse[] {
		return entities.map((e) => this.fromEntity(e));
	}
}
