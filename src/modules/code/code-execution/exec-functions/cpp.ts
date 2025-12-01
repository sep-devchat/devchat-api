import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";
import * as fs from "fs";

export const cppExecFunction: CodeExecutionFunction = async (code: string) => {
	const docker = Docker.getInstance();
	const image = "gcc:latest";
	const sandbox = await docker.acquireSandbox(image);
	try {
		const execDir = docker.getExecDir(sandbox.runId);
		fs.mkdirSync(execDir, { recursive: true });
		fs.writeFileSync(`${execDir}/main.cpp`, code);

		const compileResult = await docker.execCommand(
			sandbox.container,
			["g++", "main.cpp", "-o", "main"],
			5000,
		);

		const execResult = await docker.execCommand(sandbox.container, ["./main"]);

		await docker.releaseSandbox(sandbox);
		return {
			output: compileResult.output + execResult.output,
		};
	} catch (error) {
		await docker.destroySandbox(image, sandbox);
		throw error;
	}
};
