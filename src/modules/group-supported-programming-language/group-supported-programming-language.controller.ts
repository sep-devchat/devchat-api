import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam } from "@nestjs/swagger";
import {
	ApiMessageResponseDto,
	ApiResponseDto,
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
} from "@utils";
import { GroupGuard } from "@modules/group";
import { ProgrammingLanguageResponse } from "@modules/programming-language/dto";
import {
	AddGroupSupportedProgrammingLanguageRequest,
	GroupSupportedProgrammingLanguageResponse,
} from "./dto";
import { GroupSupportedProgrammingLanguageService } from "./group-supported-programming-language.service";

@ApiBearerAuth()
@UseGuards(GroupGuard)
@Controller("group/:groupId/supported-programming-languages")
@ApiParam({ name: "groupId", type: String, required: true })
export class GroupSupportedProgrammingLanguageController {
	constructor(
		private readonly groupSupportedProgrammingLanguageService: GroupSupportedProgrammingLanguageService,
	) {}

	@Get()
	@ApiOperation({ summary: "List supported programming languages in group" })
	@SwaggerApiResponse(ProgrammingLanguageResponse, { isArray: true })
	async list(@Param("groupId") groupId: string) {
		const items =
			await this.groupSupportedProgrammingLanguageService.listGroupLanguages(
				groupId,
			);
		const languages = items
			.map((i) => i.supportedProgrammingLanguage)
			.filter(Boolean);
		return new ApiResponseDto(
			ProgrammingLanguageResponse.fromEntities(languages),
			null,
			"Group languages retrieved successfully",
		);
	}

	@Post()
	@ApiOperation({ summary: "Add supported programming language to group" })
	@SwaggerApiResponse(GroupSupportedProgrammingLanguageResponse)
	async add(
		@Param("groupId") groupId: string,
		@Body() dto: AddGroupSupportedProgrammingLanguageRequest,
	) {
		const entity =
			await this.groupSupportedProgrammingLanguageService.addLanguageToGroup(
				groupId,
				dto.languageId,
			);
		return new ApiResponseDto(
			GroupSupportedProgrammingLanguageResponse.fromEntity(entity),
			null,
			"Added successfully",
		);
	}

	@Delete(":languageId")
	@ApiOperation({ summary: "Remove supported programming language from group" })
	@ApiParam({
		name: "languageId",
		description: "Supported programming language id",
	})
	@SwaggerApiMessageResponse()
	async remove(
		@Param("groupId") groupId: string,
		@Param("languageId") languageId: string,
	) {
		await this.groupSupportedProgrammingLanguageService.removeLanguageFromGroup(
			groupId,
			languageId,
		);
		return new ApiMessageResponseDto("Removed successfully");
	}
}
