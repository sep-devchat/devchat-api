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
import { CodeCollaborationService } from "./code-collaboration.service";
import {
	ApiResponseDto,
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
} from "@utils";
import { ApiBearerAuth } from "@nestjs/swagger";
import {
	CodeCollaborationQuery,
	CodeCollaborationResponse,
	CreateCodeCollaborationRequest,
	UpdateCodeCollaborationRequest,
} from "./dto";

@Controller("code-collaboration")
@ApiBearerAuth()
export class CodeCollaborationController {
	constructor(
		private readonly codeCollaborationService: CodeCollaborationService,
	) {}

	@Post()
	@SwaggerApiMessageResponse()
	async createOne(@Body() dto: CreateCodeCollaborationRequest) {
		await this.codeCollaborationService.createOne(dto);
		return new ApiResponseDto(null, null, "Created successfully");
	}

	@Put(":id")
	@SwaggerApiMessageResponse()
	async updateOne(
		@Param("id") id: string,
		@Body() dto: UpdateCodeCollaborationRequest,
	) {
		await this.codeCollaborationService.updateOne(id, dto);
		return new ApiResponseDto(null, null, "Updated successfully");
	}

	@Get()
	@SwaggerApiResponse(CodeCollaborationResponse, { isArray: true })
	async findMany(@Query() query: CodeCollaborationQuery) {
		const data = await this.codeCollaborationService.findMany(query);
		return new ApiResponseDto(
			CodeCollaborationResponse.fromEntities(data),
			null,
			"Fetched successfully",
		);
	}

	@Delete(":id")
	@SwaggerApiMessageResponse()
	async deleteOne(@Param("id") id: string) {
		await this.codeCollaborationService.deleteOne(id);
		return new ApiResponseDto(null, null, "Deleted successfully");
	}
}
