import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";
import * as fs from "fs";

export const javascriptExecFunction: CodeExecutionFunction = async (
	code: string,
) => {
	const docker = Docker.getInstance();
	const image = "node:22";
	const sandbox = await docker.acquireSandbox(image);
	try {
		const execDir = docker.getExecDir(sandbox.runId);
		fs.mkdirSync(execDir, { recursive: true });
		fs.writeFileSync(`${execDir}/script.js`, code);

		const result = await docker.execCommand(sandbox.container, [
			"node",
			"script.js",
		]);

		await docker.releaseSandbox(sandbox);
		return result;
	} catch (error) {
		await docker.destroySandbox(image, sandbox);
		throw error;
	}
};
