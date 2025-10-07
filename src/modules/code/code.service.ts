import { Injectable } from "@nestjs/common";
import { RunCodeRequest } from "./dto";
import { execMap } from "./code-execution";

@Injectable()
export class CodeService {
	constructor() {}

	async runCode(dto: RunCodeRequest) {
		const result = await execMap[dto.language](dto.code);
		return result;
	}
}
