import { ReportEntity } from "@db/entities";
import { Profile } from "@modules/auth/dto";
import {
	DirectMessageResponse,
	MessageResponse,
	ThreadMessageResponse,
} from "@modules/message/dto";
import { ReportCategoryResponse } from "@modules/report-category/dto";
import { ApiProperty } from "@nestjs/swagger";
import { Builder } from "builder-pattern";

export class ReportResponse {
	@ApiProperty()
	id: string;

	@ApiProperty({ required: false })
	content: string | null;

	@ApiProperty()
	messageType: string;

	@ApiProperty({ type: MessageResponse })
	message: MessageResponse;

	@ApiProperty({ type: DirectMessageResponse })
	directMessage: DirectMessageResponse;

	@ApiProperty({ type: ThreadMessageResponse })
	threadMessage: ThreadMessageResponse;

	@ApiProperty({ type: ReportCategoryResponse, isArray: true })
	reportCategories: ReportCategoryResponse[];

	@ApiProperty({ type: Profile })
	createdBy: Profile;

	@ApiProperty()
	createdAt: Date;

	static fromEntity(entity: ReportEntity): ReportResponse {
		return Builder(ReportResponse)
			.id(entity.id)
			.content(entity.content)
			.message(
				entity.message ? MessageResponse.fromEntity(entity.message) : null,
			)
			.directMessage(
				entity.directMessage
					? DirectMessageResponse.fromEntity(entity.directMessage)
					: null,
			)
			.threadMessage(
				entity.threadMessage
					? ThreadMessageResponse.fromEntity(entity.threadMessage)
					: null,
			)
			.reportCategories(
				ReportCategoryResponse.fromEntities(
					entity.reportReportCategories.map((rrc) => rrc.reportCategory),
				),
			)
			.createdBy(Profile.fromEntity(entity.createdBy))
			.createdAt(entity.createdAt)
			.build();
	}

	static fromEntities(entities: ReportEntity[]): ReportResponse[] {
		return entities.map((entity) => ReportResponse.fromEntity(entity));
	}
}
