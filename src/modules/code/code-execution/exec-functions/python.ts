import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";

export const pythonExecFunction: CodeExecutionFunction = async (
	code: string,
) => {
	const docker = Docker.getInstance();

	const runId = uuidv4();
	const container = await docker.createExecContainer("python:3.14", runId);
	await container.start();

	// Prepare python file
	const execDir = docker.getExecDir(runId);
	console.log("Preparing Python file...");
	fs.writeFileSync(`${execDir}/script.py`, code);

	const result = await docker.execCommand(container, ["python", "script.py"]);

	docker.cleanupContainer(container, runId);

	return result;
};
