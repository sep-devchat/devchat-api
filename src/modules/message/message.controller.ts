import {
	Controller,
	Param,
	Body,
	Query,
	Post,
	Get,
	Put,
	Delete,
} from "@nestjs/common";
import { MessageService } from "./message.service";
import {
	CreateMessageRequest,
	UpdateMessageRequest,
	MessageQuery,
	MessageResponse,
} from "./dto";
import {
	ApiResponseDto,
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
} from "@utils";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("message")
@ApiBearerAuth()
export class MessageController {
	constructor(private readonly messageService: MessageService) {}

	@Post()
	@SwaggerApiMessageResponse()
	async createOne(@Body() dto: CreateMessageRequest) {
		await this.messageService.createOne(dto);
		return new ApiResponseDto(null, null, "Created successfully");
	}

	@Put(":id")
	@SwaggerApiMessageResponse()
	async updateOne(@Param("id") id: string, @Body() dto: UpdateMessageRequest) {
		await this.messageService.updateOne(id, dto);
		return new ApiResponseDto(null, null, "Updated successfully");
	}

	@Get()
	@SwaggerApiResponse(MessageResponse, { isArray: true })
	async findMany() {
		const data = await this.messageService.findMany();
		return new ApiResponseDto(
			MessageResponse.fromEntities(data),
			null,
			"Fetched successfully",
		);
	}

	@Get(":id")
	@SwaggerApiResponse(MessageResponse)
	async findOne(@Param("id") id: string) {
		const data = await this.messageService.findOne(id);
		return new ApiResponseDto(
			MessageResponse.fromEntity(data),
			null,
			"Fetched successfully",
		);
	}

	@Delete(":id")
	@SwaggerApiMessageResponse()
	async deleteOne(@Param("id") id: string) {
		await this.messageService.deleteOne(id);
		return new ApiResponseDto(null, null, "Deleted successfully");
	}
}
