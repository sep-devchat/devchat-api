import { MessageEntity } from "@db/entities";
import { Profile } from "@modules/auth/dto";
import { ChannelResponse } from "@modules/channel/dto";

export class MessageResponse {
	id: string;
	channelId: string;
	threadId: string | null;
	parentMessageId: string | null;
	parentMessage: MessageResponse | null;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
	sender: Profile;
	channel?: ChannelResponse;
	codeBlockId?: string;

	static fromEntity(entity: MessageEntity): MessageResponse {
		return {
			id: entity.id,
			channelId: entity.channelId,
			threadId: entity.threadId,
			parentMessageId: entity.parentMessageId,
			parentMessage: entity.parentMessage
				? this.fromEntity(entity.parentMessage)
				: null,
			content: entity.content,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			deletedAt: entity.deletedAt,
			sender: entity.sender ? Profile.fromEntity(entity.sender) : undefined,
			channel: entity.channel && ChannelResponse.fromEntity(entity.channel),
			codeBlockId: entity.codeBlockId,
		};
	}

	static fromEntities(entities: MessageEntity[]): MessageResponse[] {
		return entities.map((e) => this.fromEntity(e));
	}
}
