import { Body, Controller, Post } from "@nestjs/common";
import { CodeService } from "./code.service";
import { CodeExecutionResponse, RunCodeRequest } from "./dto";
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
}
