import { ProgrammingLanguageEnum } from "@utils";
import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";

export const pythonExecFunction: CodeExecutionFunction = async (
	code: string,
) => {
	const docker = Docker.getInstance();

	const container = await docker.prepareContainer(
		ProgrammingLanguageEnum.PYTHON,
	);
	const runId = uuidv4();

	// Prepare python file
	await docker.prepareExecDir(runId);

	const execDir = docker.getExecDir(runId);
	console.log("Preparing Python file...");
	fs.writeFileSync(`${execDir}/script.py`, code);

	const result = await docker.execCommand(container, runId, [
		"python",
		"script.py",
	]);

	await docker.cleanupExecDir(runId);

	return result;
};
