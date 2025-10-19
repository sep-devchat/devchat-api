import {
	Controller,
	Param,
	Body,
	Query,
	Post,
	Get,
	Put,
	Delete,
	UseGuards,
} from "@nestjs/common";
import { CodeBlockService } from "./code-block.service";
import {
	CreateCodeBlockRequest,
	UpdateCodeBlockRequest,
	CodeBlockQuery,
	CodeBlockResponse,
} from "./dto";
import {
	ApiMessageResponseDto,
	ApiResponseDto,
	AuditLog,
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
} from "@utils";
import { ApiBearerAuth, ApiOperation, ApiParam } from "@nestjs/swagger";
import { AuthGuard } from "@modules/auth";

@Controller("code-block")
@ApiBearerAuth()
export class CodeBlockController {
	constructor(private readonly codeBlockService: CodeBlockService) {}

	@Post()
	@ApiOperation({ summary: "Create a new code block" })
	@SwaggerApiResponse(CodeBlockResponse)
	@AuditLog({
		action: "CODE_BLOCK_CREATE",
		entityType: "CodeBlock",
		captureResponse: true,
	})
	async createOne(@Body() dto: CreateCodeBlockRequest) {
		const response = await this.codeBlockService.createOne(dto);
		return new ApiResponseDto(
			CodeBlockResponse.fromEntity(response),
			null,
			"Created successfully",
		);
	}

	@Put(":id")
	@ApiOperation({ summary: "Update a code block" })
	@ApiParam({ name: "id", description: "Code Block ID" })
	@SwaggerApiMessageResponse()
	async updateOne(
		@Param("id") id: string,
		@Body() dto: UpdateCodeBlockRequest,
	) {
		await this.codeBlockService.updateOne(id, dto);
		return new ApiMessageResponseDto("Updated successfully");
	}

	@Get()
	@ApiOperation({ summary: "Get all code blocks" })
	@SwaggerApiResponse(CodeBlockResponse, {
		withPagination: true,
		isArray: true,
	})
	async findMany(@Query() query: CodeBlockQuery) {
		const { data, pagination } = await this.codeBlockService.findMany(query);
		return new ApiResponseDto(
			CodeBlockResponse.fromEntities(data),
			pagination,
			"Code blocks retrieved successfully",
		);
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a specific code block" })
	@ApiParam({ name: "id", description: "Code Block ID" })
	@SwaggerApiResponse(CodeBlockResponse)
	async findOne(@Param("id") id: string) {
		const data = await this.codeBlockService.findOne(id);
		return new ApiResponseDto(
			CodeBlockResponse.fromEntity(data),
			null,
			"Code block retrieved successfully",
		);
	}

	@Delete(":id")
	@ApiOperation({ summary: "Delete a code block" })
	@ApiParam({ name: "id", description: "Code Block ID" })
	@SwaggerApiMessageResponse()
	async deleteOne(@Param("id") id: string) {
		await this.codeBlockService.deleteOne(id);
		return new ApiMessageResponseDto("Deleted successfully");
	}
}
