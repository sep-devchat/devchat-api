import { ProgrammingLanguageEnum } from "@utils";
import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";

export const cppExecFunction: CodeExecutionFunction = async (code: string) => {
	const docker = Docker.getInstance();

	const runId = uuidv4();
	const container = await docker.prepareContainer(ProgrammingLanguageEnum.CPP);
	await docker.prepareExecDir(runId);

	// Prepare C++ file
	const execDir = docker.getExecDir(`${runId}`);
	console.log("Preparing C++ file...");
	fs.writeFileSync(`${execDir}/main.cpp`, code);

	let output = "";

	// Compile
	const compileResult = await docker.execCommand(
		container,
		runId,
		["g++", "main.cpp", "-o", "main"],
		20000,
	);

	let isTimeout = compileResult.timeout;
	output += compileResult.output;

	if (!isTimeout) {
		// Run
		const execResult = await docker.execCommand(container, runId, ["./main"]);
		output += execResult.output;
		isTimeout = execResult.timeout;
	}

	await docker.cleanupExecDir(runId);
	return {
		output,
		timeout: isTimeout,
	};
};
