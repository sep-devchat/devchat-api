import { ProgrammingLanguageEnum } from "@utils";
import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";

export const javaExecFunction: CodeExecutionFunction = async (code: string) => {
	const docker = Docker.getInstance();

	const runId = uuidv4();
	const container = await docker.prepareContainer(ProgrammingLanguageEnum.JAVA);

	// Prepare java file
	await docker.prepareExecDir(runId);

	const execDir = docker.getExecDir(runId);
	console.log("Preparing Java file...");
	fs.writeFileSync(`${execDir}/Main.java`, code);

	let output = "";

	// Compile
	const compileResult = await docker.execCommand(
		container,
		runId,
		["javac", "Main.java"],
		20000,
	);

	let isTimeout = compileResult.timeout;
	output += compileResult.output;

	if (!isTimeout) {
		// Run
		const execResult = await docker.execCommand(container, runId, [
			"java",
			"Main",
		]);
		output += execResult.output;
		isTimeout = execResult.timeout;
	}

	await docker.cleanupExecDir(runId);

	return {
		output,
		timeout: isTimeout,
	};
};
