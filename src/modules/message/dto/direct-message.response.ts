import { DirectMessageEntity } from "@db/entities";
import { Profile } from "@modules/auth/dto";

export class DirectMessageResponse {
	id: string;
	from: Profile;
	to: Profile;
	content: string;
	parentMessageId: string | null;
	codeBlockId?: string;
	createdAt: Date;
	updatedAt: Date;

	static fromEntity(entity: DirectMessageEntity): DirectMessageResponse {
		return {
			id: entity.id,
			from: Profile.fromEntity(entity.fromUser),
			to: Profile.fromEntity(entity.toUser),
			content: entity.content,
			parentMessageId: entity.parentMessageId,
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
