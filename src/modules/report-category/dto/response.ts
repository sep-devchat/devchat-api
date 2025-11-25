import { ApiProperty } from "@nestjs/swagger";
import { ReportCategoryEntity } from "@db/entities";
import { Builder } from "builder-pattern";

export class ReportCategoryResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	description: string;

	@ApiProperty({
		description: "Indicates if the category has been soft deleted",
	})
	isRemoved: boolean;

	static fromEntity(entity: ReportCategoryEntity): ReportCategoryResponse {
		return Builder<ReportCategoryResponse>()
			.id(entity.id)
			.name(entity.name)
			.description(entity.description)
			.isRemoved(entity.isRemoved)
			.build();
	}

	static fromEntities(
		entities: ReportCategoryEntity[],
	): ReportCategoryResponse[] {
		return entities.map((entity) => ReportCategoryResponse.fromEntity(entity));
	}
}
