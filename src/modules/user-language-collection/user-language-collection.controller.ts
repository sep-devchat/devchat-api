import { Controller, Param, Body, Post, Put, Delete } from "@nestjs/common";
import { UserLanguageCollectionService } from "./user-language-collection.service";
import {
	CreateUserLanguageCollectionRequest,
	UpdateUserLanguageCollectionRequest,
} from "./dto";
import {
	ApiResponseDto,
	SwaggerApiResponse,
	SwaggerApiMessageResponse,
} from "@utils";
import { UserLanguageCollectionResponse } from "./dto/response";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller("user-language-collection")
export class UserLanguageCollectionController {
	constructor(
		private readonly userLanguageCollectionService: UserLanguageCollectionService,
	) {}

	@Post()
	@SwaggerApiResponse(UserLanguageCollectionResponse)
	async createOne(@Body() dto: CreateUserLanguageCollectionRequest) {
		const entity = await this.userLanguageCollectionService.createOne(dto);
		return new ApiResponseDto(entity, null, "Created successfully");
	}

	@Put(":id")
	@SwaggerApiResponse(UserLanguageCollectionResponse)
	async updateOne(
		@Param("id") id: string,
		@Body() dto: UpdateUserLanguageCollectionRequest,
	) {
		const entity = await this.userLanguageCollectionService.updateOne(id, dto);
		return new ApiResponseDto(entity, null, "Updated successfully");
	}

	@Delete(":id")
	@SwaggerApiMessageResponse()
	async deleteOne(@Param("id") id: string) {
		await this.userLanguageCollectionService.deleteOne(id);
		return new ApiResponseDto(null, null, "Deleted successfully");
	}
}
