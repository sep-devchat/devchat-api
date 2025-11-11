import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID } from "class-validator";

export class CreateNotificationRequest {
	@ApiProperty()
	@IsUUID()
	toUserId: string;

	@ApiProperty()
	@IsString()
	title: string;

	@ApiProperty()
	@IsString()
	content: string;

	@ApiProperty({
		description: "Source identifier (e.g. task, message, system)",
	})
	@IsString()
	notificationSource: string;
}
