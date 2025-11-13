import { MessageEntity } from "@db/entities";
import { Profile } from "@modules/auth/dto";
import { ChannelResponse } from "@modules/channel/dto";
import { AttachmentResponse } from "@modules/attachment/dto";
import { CodeBlockResponse } from "@modules/code-block/dto";

export class MessageResponse {
	id: string;
	channelId: string;
	threadId: string | null;
	parentMessageId: string | null;
	content: string;
	codeBlockId?: string | null;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
	sender: Profile;
	channel?: ChannelResponse;
	attachments?: AttachmentResponse[]; // populated when requested (e.g., send flow)
	codeBlock?: CodeBlockResponse | undefined; // populated when code block is associated

	static fromEntity(entity: MessageEntity): MessageResponse {
		return {
			id: entity.id,
			channelId: entity.channelId,
			threadId: entity.threadId,
			parentMessageId: entity.parentMessageId,
			content: entity.content,
			codeBlockId: entity.codeBlockId ?? null,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			deletedAt: entity.deletedAt,
			sender: Profile.fromEntity(entity.sender),
			channel: entity.channel && ChannelResponse.fromEntity(entity.channel),
			attachments: undefined,
			codeBlock:
				entity.codeBlock && (CodeBlockResponse as any).fromEntity
					? CodeBlockResponse.fromEntity(entity.codeBlock as any)
					: undefined,
		};
	}

	static fromEntities(entities: MessageEntity[]): MessageResponse[] {
		return entities.map((e) => this.fromEntity(e));
	}
}
