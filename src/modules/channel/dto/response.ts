import { ChannelEntity } from "@db/entities";
import { ApiProperty } from "@nestjs/swagger";

export class ChannelResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty({ required: false, nullable: true })
	description?: string | null;

	@ApiProperty()
	groupId: string;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	createdBy: string;

	static fromEntity(entity: ChannelEntity): ChannelResponse {
		return {
			id: entity.id,
			name: entity.name,
			description: entity.description,
			groupId: entity.groupId,
			createdAt: entity.createdAt,
			createdBy: entity.createdBy,
		};
	}

	static fromEntities(entities: ChannelEntity[]): ChannelResponse[] {
		return entities.map((e) => this.fromEntity(e));
	}
}
