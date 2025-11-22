import { MessageEntity } from "@db/entities";
import { Profile } from "@modules/auth/dto";
import { ChannelResponse } from "@modules/channel/dto";
import { ThreadResponse } from "@modules/thread/dto";

export class MessageResponse {
	id: string;
	channelId: string;
	parentMessageId: string | null;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
	thread?: ThreadResponse;
	sender: Profile;
	channel?: ChannelResponse;

	static fromEntity(entity: MessageEntity): MessageResponse {
		return {
			id: entity.id,
			channelId: entity.channelId,
			parentMessageId: entity.parentMessageId,
			content: entity.content,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			deletedAt: entity.deletedAt,
			sender: Profile.fromEntity(entity.sender),
			thread: entity.thread && ThreadResponse.fromEntity(entity.thread),
			channel: entity.channel && ChannelResponse.fromEntity(entity.channel),
		};
	}

	static fromEntities(entities: MessageEntity[]): MessageResponse[] {
		return entities.map((e) => this.fromEntity(e));
	}
}
