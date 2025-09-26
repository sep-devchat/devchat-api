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
} from "./dto";
import { ApiResponseDto } from "@utils";

@Controller("message")
export class MessageController {
	constructor(private readonly messageService: MessageService) {}

	@Post()
	async createOne(@Body() dto: CreateMessageRequest) {
		await this.messageService.createOne(dto);
		return new ApiResponseDto(null, null, "Created successfully");
	}

	@Put(":id")
	async updateOne(@Param("id") id: string, @Body() dto: UpdateMessageRequest) {
		await this.messageService.updateOne(id, dto);
		return new ApiResponseDto(null, null, "Updated successfully");
	}

	@Get()
	async findMany(@Query() query: MessageQuery) {
		const data = await this.messageService.findMany(query);
		return new ApiResponseDto(data);
	}

	@Get(":id")
	async findOne(@Param("id") id: string) {
		const data = await this.messageService.findOne(id);
		return new ApiResponseDto(data);
	}

	@Delete(":id")
	async deleteOne(@Param("id") id: string) {
		await this.messageService.deleteOne(id);
		return new ApiResponseDto(null, null, "Deleted successfully");
	}
}
