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
import { ProgrammingLanguageService } from "./programming-language.service";
import {
	CreateProgrammingLanguageRequest,
	UpdateProgrammingLanguageRequest,
	ProgrammingLanguageQuery,
} from "./dto";
import {
	ApiResponseDto,
	SwaggerApiResponse,
	SwaggerApiMessageResponse,
	SkipAuth,
	AdminRole,
} from "@utils";
import { ProgrammingLanguageResponse } from "./dto/response";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("programming-language")
@ApiBearerAuth()
export class ProgrammingLanguageController {
	constructor(
		private readonly programmingLanguageService: ProgrammingLanguageService,
	) {}

	@Post()
	@AdminRole()
	@SwaggerApiResponse(ProgrammingLanguageResponse)
	async createOne(@Body() dto: CreateProgrammingLanguageRequest) {
		const entity = await this.programmingLanguageService.createOne(dto);
		return new ApiResponseDto(entity, null, "Created successfully");
	}

	@Put(":id")
	@AdminRole()
	@SwaggerApiResponse(ProgrammingLanguageResponse)
	async updateOne(
		@Param("id") id: string,
		@Body() dto: UpdateProgrammingLanguageRequest,
	) {
		const entity = await this.programmingLanguageService.updateOne(id, dto);
		return new ApiResponseDto(entity, null, "Updated successfully");
	}

	@Get("toggle-is-active/:id")
	@AdminRole()
	@SwaggerApiResponse(ProgrammingLanguageResponse)
	async toggleIsActive(@Param("id") id: string) {
		const entity = await this.programmingLanguageService.toggleIsActive(id);
		return new ApiResponseDto(entity, null, "Toggled isActive successfully");
	}

	@Get("active-only")
	@SwaggerApiResponse(ProgrammingLanguageResponse, { isArray: true })
	async getActiveLanguages() {
		const data = await this.programmingLanguageService.getActiveLanguages();
		return new ApiResponseDto(ProgrammingLanguageResponse.fromEntities(data));
	}

	@Get()
	@AdminRole()
	@SwaggerApiResponse(ProgrammingLanguageResponse, {
		isArray: true,
		withPagination: true,
	})
	async findMany(@Query() query: ProgrammingLanguageQuery) {
		const data = await this.programmingLanguageService.findMany(query);
		return new ApiResponseDto(
			ProgrammingLanguageResponse.fromEntities(data.data),
			data.pagination,
		);
	}

	@Get(":id")
	@AdminRole()
	@SwaggerApiResponse(ProgrammingLanguageResponse)
	async findOne(@Param("id") id: string) {
		const data = await this.programmingLanguageService.findOne(id);
		return new ApiResponseDto(data);
	}
}
