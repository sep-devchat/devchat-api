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
import { TodoService } from "./todo.service";
import {
	CreateTodoRequest,
	UpdateTodoRequest,
	TodoQuery,
	TodoResponse,
} from "./dto";
import {
	ApiMessageResponseDto,
	ApiResponseDto,
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
} from "@utils";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiProperty,
} from "@nestjs/swagger";

@Controller("todo")
@ApiBearerAuth()
export class TodoController {
	constructor(private readonly todoService: TodoService) {}

	@Post()
	@ApiOperation({
		summary: "Create a todo item for authenticated user",
	})
	@SwaggerApiMessageResponse()
	async createOne(@Body() dto: CreateTodoRequest) {
		await this.todoService.createOne(dto);
		return new ApiResponseDto(null, null, "Created successfully");
	}

	@Put(":id")
	@ApiParam({
		name: "id",
		description: "Todo item's id",
	})
	@ApiOperation({
		summary: "Update a todo item of authenticated user",
	})
	async updateOne(@Param("id") id: string, @Body() dto: UpdateTodoRequest) {
		await this.todoService.updateOne(id, dto);
		return new ApiMessageResponseDto("Updated successfully");
	}

	@Get()
	@ApiOperation({
		summary: "Get the paginated todo items of authenticated user",
	})
	@SwaggerApiResponse(TodoResponse, { isArray: true, withPagination: true })
	async findMany(@Query() query: TodoQuery) {
		const { data, pagination } = await this.todoService.findMany(query);
		return new ApiResponseDto(
			data,
			pagination,
			"Todo items retrieved successfully",
		);
	}

	@Get(":id")
	@ApiParam({
		name: "id",
		description: "Todo item's id",
	})
	@ApiOperation({
		summary: "Get a todo item of authenticated user",
	})
	@SwaggerApiResponse(TodoResponse)
	async findOne(@Param("id") id: string) {
		const data = await this.todoService.findOne(id);
		return new ApiResponseDto(data, null, "Todo item retrieve successfully");
	}

	@Delete(":id")
	@ApiParam({
		name: "id",
		description: "Todo item's id",
	})
	@ApiOperation({
		summary: "Delete a todo item of authenticated user",
	})
	async deleteOne(@Param("id") id: string) {
		await this.todoService.deleteOne(id);
		return new ApiMessageResponseDto("Deleted successfully");
	}
}
