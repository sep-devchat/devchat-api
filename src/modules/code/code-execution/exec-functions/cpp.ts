import { ProgrammingLanguageEnum } from "@utils";
import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";

export const cppExecFunction: CodeExecutionFunction = async (code: string) => {
	const docker = Docker.getInstance();
	const sandbox = await docker.prepareSandbox(ProgrammingLanguageEnum.CPP);

	// Prepare C++ file
	console.log("Preparing C++ file...");
	await docker.writeFileToSandbox(sandbox, "main.cpp", code);

	const { container } = sandbox;

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
