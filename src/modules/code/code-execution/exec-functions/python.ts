import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";
import * as fs from "fs";

export const pythonExecFunction: CodeExecutionFunction = async (
	code: string,
) => {
	const docker = Docker.getInstance();
	const image = "python:3.14";
	const sandbox = await docker.acquireSandbox(image);
	try {
		const execDir = docker.getExecDir(sandbox.runId);
		fs.mkdirSync(execDir, { recursive: true });
		fs.writeFileSync(`${execDir}/script.py`, code);

		const result = await docker.execCommand(sandbox.container, [
			"python",
			"script.py",
		]);

		await docker.releaseSandbox(sandbox);
		return result;
	} catch (error) {
		await docker.destroySandbox(image, sandbox);
		throw error;
	}
};
