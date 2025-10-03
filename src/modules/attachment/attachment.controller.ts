import { Controller, Param, Query, Get } from "@nestjs/common";
import { AttachmentService } from "./attachment.service";
import { AttachmentQuery } from "./dto";
import { ApiResponseDto, SwaggerApiResponse } from "@utils";
import { AttachmentResponse } from "./dto";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller("attachment")
export class AttachmentController {
	constructor(private readonly attachmentService: AttachmentService) {}

	@Get()
	@SwaggerApiResponse(AttachmentResponse, {
		isArray: true,
		withPagination: true,
	})
	async findMany(@Query() query: AttachmentQuery) {
		const result = await this.attachmentService.findMany(query);
		return new ApiResponseDto(
			result.data,
			result.pagination,
			"Fetched successfully",
		);
	}

	@Get(":id")
	@SwaggerApiResponse(AttachmentResponse)
	async findOne(@Param("id") id: string) {
		const data = await this.attachmentService.findOne(id);
		return new ApiResponseDto(data, null, "Fetched successfully");
	}
}
