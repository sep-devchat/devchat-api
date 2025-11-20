import { ThreadEntity } from "@db/entities";
import { ApiProperty } from "@nestjs/swagger";

export class ThreadResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty({ required: false, nullable: true })
	description?: string | null;

	@ApiProperty()
	channelId: string;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	createdById: string;

	@ApiProperty()
	messageId: string;

	static fromEntity(entity: ThreadEntity): ThreadResponse {
		return {
			id: entity.id,
			name: entity.name,
			channelId: entity.channelId,
			messageId: entity.messageId,
			createdAt: entity.createdAt,
			createdById: entity.createdById,
		};
	}

	static fromEntities(entities: ThreadEntity[]): ThreadResponse[] {
		return entities.map((e) => this.fromEntity(e));
	}
}
