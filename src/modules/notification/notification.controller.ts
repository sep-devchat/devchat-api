import {
	Controller,
	Param,
	Body,
	Query,
	Get,
	Put,
	Delete,
	Post,
} from "@nestjs/common";
import { NotificationService } from "./notification.service";
import {
	NotificationQuery,
	NotificationResponse,
	MarkReadManyRequest,
	DeleteManyRequest,
	CreateNotificationRequest,
} from "./dto";
import {
	ApiResponseDto,
	SwaggerApiResponse,
	SwaggerApiMessageResponse,
	SkipAuth,
} from "@utils";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";

@Controller("notification")
@ApiBearerAuth()
export class NotificationController {
	constructor(private readonly notificationService: NotificationService) {}

	@Post("test")
	@SkipAuth()
	async testNotification(@Body() dto: CreateNotificationRequest) {
		await this.notificationService.createOne(dto);
		return new ApiResponseDto(null, null, "Notification sent to socket");
	}

	@Get()
	@ApiOperation({
		summary: "List notifications with unread filter and cursor by createdAt",
	})
	@SwaggerApiResponse(NotificationResponse, { isArray: true })
	async findMany(@Query() query: NotificationQuery) {
		const entities = await this.notificationService.findMany(query);
		const data = NotificationResponse.fromEntities(entities);
		return new ApiResponseDto(data);
	}

	@Put("mark-read")
	@ApiOperation({ summary: "Mark notifications as read (bulk)" })
	@SwaggerApiMessageResponse()
	async markReadMany(@Body() body: MarkReadManyRequest) {
		await this.notificationService.markReadMany(body.ids);
		return new ApiResponseDto(null, null, "Marked as read");
	}

	@Post("bulk-delete")
	@ApiOperation({ summary: "Delete notifications (bulk)" })
	@SwaggerApiMessageResponse()
	async deleteMany(@Body() body: DeleteManyRequest) {
		await this.notificationService.deleteMany(body.ids);
		return new ApiResponseDto(null, null, "Deleted successfully");
	}
}
