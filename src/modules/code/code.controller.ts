import { Body, Controller, Post } from "@nestjs/common";
import { CodeService } from "./code.service";
import {
	CodeExecutionResponse,
	RunCodeBlockRequest,
	RunCodeCollabRequest,
	RunCodeRequest,
} from "./dto";
import { ApiResponseDto, SwaggerApiResponse } from "@utils";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("code")
@ApiBearerAuth()
export class CodeController {
	constructor(private readonly codeService: CodeService) {}

	@Post("run")
	@SwaggerApiResponse(CodeExecutionResponse)
	async runCode(@Body() dto: RunCodeRequest) {
		const data = await this.codeService.runCode(dto);
		return new ApiResponseDto(data);
	}

	@Post("code-block")
	@SwaggerApiResponse(CodeExecutionResponse)
	async runCodeBlock(@Body() dto: RunCodeBlockRequest) {
		const data = await this.codeService.runCodeBlock(dto);
		return new ApiResponseDto(data);
	}

	@Post("code-collab")
	@SwaggerApiResponse(CodeExecutionResponse)
	async runCodeCollab(@Body() dto: RunCodeCollabRequest) {
		const data = await this.codeService.runCodeCollab(dto);
		return new ApiResponseDto(data);
	}
}
