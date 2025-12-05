import { ProgrammingLanguageEnum } from "@utils";
import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";
import * as fs from "fs";
import * as path from "path";

export const cppExecFunction: CodeExecutionFunction = async (code: string) => {
	const docker = Docker.getInstance();
	const { container, execDir } = await docker.prepareSandbox(
		ProgrammingLanguageEnum.CPP,
	);

	if (!execDir) {
		throw new Error("C++ sandbox execution directory is not available");
	}

	// Prepare C++ file
	console.log("Preparing C++ file...");
	fs.writeFileSync(path.join(execDir, "main.cpp"), code);

	let output = "";

	// Compile
	const compileResult = await docker.execCommand(
		container,
		["g++", "main.cpp", "-o", "main"],
		20000,
	);

	let isTimeout = compileResult.timeout;
	output += compileResult.output;

	if (!isTimeout) {
		// Run
		const execResult = await docker.execCommand(container, ["./main"]);
		output += execResult.output;
		isTimeout = execResult.timeout;
	}

	return {
		output,
		timeout: isTimeout,
	};
};
