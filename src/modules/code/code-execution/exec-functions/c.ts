import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";

export const cExecFunction: CodeExecutionFunction = async (code: string) => {
	const docker = Docker.getInstance();

	const runId = uuidv4();
	const container = await docker.createExecContainer("gcc:latest", runId);
	await container.start();

	// Prepare C file
	const execDir = docker.getExecDir(`${runId}`);
	console.log("Preparing C file...");
	fs.writeFileSync(`${execDir}/main.c`, code);

	// Compile
	const compileResult = await docker.execCommand(container, [
		"gcc",
		"main.c",
		"-o",
		"main",
	]);

	// Run
	const execResult = await docker.execCommand(container, ["./main"]);

	docker.cleanupContainer(container, runId);

	return {
		output: compileResult.output + execResult.output,
	};
};
