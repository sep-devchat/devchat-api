import { ApiProperty } from "@nestjs/swagger";
import { MessageTypeEnum } from "@utils";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class CreateReportRequest {
	@ApiProperty()
	@IsString()
	messageId: string;

	@ApiProperty({ required: false })
	@IsString()
	@IsOptional()
	content: string | null;

	@ApiProperty()
	@IsString({ each: true })
	reportCategoryIds: string[];

	@ApiProperty({ enum: MessageTypeEnum })
	@IsEnum(MessageTypeEnum)
	messageType: MessageTypeEnum;
}
