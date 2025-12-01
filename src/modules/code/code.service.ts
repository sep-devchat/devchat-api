import { Injectable } from "@nestjs/common";
import { RunCodeRequest } from "./dto";
import { CodeExecutionResult, execMap } from "./code-execution";
import { AiService } from "@modules/ai";
// import { Builder } from "builder-pattern";
// import { CheckCodeResponse } from "@modules/ai/dto";

@Injectable()
export class CodeService {
	constructor(private readonly aiService: AiService) {}

	async runCode(dto: RunCodeRequest): Promise<CodeExecutionResult> {
		// let aiOutput: CheckCodeResponse;
		// try {
		// 	aiOutput = await this.aiService.checkCode(dto.language, dto.code);
		// } catch (err) {
		// 	console.error("Error during code check:", err);
		// }

		// if (aiOutput && !aiOutput.passed) {
		// 	return Builder<CodeExecutionResult>()
		// 		.output(
		// 			`Code check failed. Output from AI:\n${aiOutput.output || "No output provided."}`,
		// 		)
		// 		.build();
		// }

		const result = await execMap[dto.language](dto.code);
		return result;
	}
}
