import { MessageEntity } from "@db/entities";
import { Profile } from "@modules/auth/dto";
import { ChannelResponse } from "@modules/channel/dto";
import { ThreadResponse } from "@modules/thread/dto";

export class MessageResponse {
	id: string;
	channelId: string;
	parentMessageId: string | null;
	parentMessage: MessageResponse | null;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	sender: Profile;
	thread?: ThreadResponse;
	channel?: ChannelResponse;
	codeBlockId?: string;

	static fromEntity(entity: MessageEntity): MessageResponse {
		return {
			id: entity.id,
			channelId: entity.channelId,
			parentMessageId: entity.parentMessageId,
			parentMessage: entity.parentMessage
				? this.fromEntity(entity.parentMessage)
				: null,
			content: entity.content,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			sender: entity.sender ? Profile.fromEntity(entity.sender) : undefined,
			channel: entity.channel && ChannelResponse.fromEntity(entity.channel),
			thread: entity.thread && ThreadResponse.fromEntity(entity.thread),
			codeBlockId: entity.codeBlockId,
		};
	}

	static fromEntities(entities: MessageEntity[]): MessageResponse[] {
		return entities.map((e) => this.fromEntity(e));
	}
}
