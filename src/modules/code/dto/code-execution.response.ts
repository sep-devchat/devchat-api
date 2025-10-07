import { ApiProperty } from "@nestjs/swagger";
import { CodeExecutionResult } from "../code-execution";

export class CodeExecutionResponse implements CodeExecutionResult {
	@ApiProperty()
	output: string;
}
