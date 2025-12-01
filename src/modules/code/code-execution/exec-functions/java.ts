import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";
import * as fs from "fs";

export const javaExecFunction: CodeExecutionFunction = async (code: string) => {
	const docker = Docker.getInstance();
	const image = "openjdk:21-jdk";
	const sandbox = await docker.acquireSandbox(image);
	try {
		const execDir = docker.getExecDir(sandbox.runId);
		fs.mkdirSync(execDir, { recursive: true });
		fs.writeFileSync(`${execDir}/Main.java`, code);

		const compileResult = await docker.execCommand(
			sandbox.container,
			["javac", "Main.java"],
			5000,
		);

		const execResult = await docker.execCommand(sandbox.container, [
			"java",
			"Main",
		]);

		await docker.releaseSandbox(sandbox);
		return {
			output: compileResult.output + execResult.output,
		};
	} catch (error) {
		await docker.destroySandbox(image, sandbox);
		throw error;
	}
};
