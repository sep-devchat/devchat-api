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
} from "@utils";
import { ProgrammingLanguageResponse } from "./dto/response";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("programming-language")
export class ProgrammingLanguageController {
	constructor(
		private readonly programmingLanguageService: ProgrammingLanguageService,
	) {}

	@Post()
	@ApiBearerAuth()
	@SwaggerApiResponse(ProgrammingLanguageResponse)
	async createOne(@Body() dto: CreateProgrammingLanguageRequest) {
		const entity = await this.programmingLanguageService.createOne(dto);
		return new ApiResponseDto(entity, null, "Created successfully");
	}

	@Put(":id")
	@ApiBearerAuth()
	@SwaggerApiResponse(ProgrammingLanguageResponse)
	async updateOne(
		@Param("id") id: string,
		@Body() dto: UpdateProgrammingLanguageRequest,
	) {
		const entity = await this.programmingLanguageService.updateOne(id, dto);
		return new ApiResponseDto(entity, null, "Updated successfully");
	}

	@Get()
	@SwaggerApiResponse(ProgrammingLanguageResponse, {
		isArray: true,
		withPagination: true,
	})
	@SkipAuth()
	async findMany(@Query() query: ProgrammingLanguageQuery) {
		const { data, pagination } =
			await this.programmingLanguageService.findMany(query);
		return new ApiResponseDto(data, pagination);
	}

	@Get(":id")
	@SkipAuth()
	@SwaggerApiResponse(ProgrammingLanguageResponse)
	async findOne(@Param("id") id: string) {
		const data = await this.programmingLanguageService.findOne(id);
		return new ApiResponseDto(data);
	}

	@Delete(":id")
	@ApiBearerAuth()
	@SwaggerApiMessageResponse()
	async deleteOne(@Param("id") id: string) {
		await this.programmingLanguageService.deleteOne(id);
		return new ApiResponseDto(null, null, "Deleted successfully");
	}
}
