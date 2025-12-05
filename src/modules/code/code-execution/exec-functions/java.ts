import { ProgrammingLanguageEnum } from "@utils";
import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";
import * as fs from "fs";
import * as path from "path";

export const javaExecFunction: CodeExecutionFunction = async (code: string) => {
	const docker = Docker.getInstance();
	const { container, execDir } = await docker.prepareSandbox(
		ProgrammingLanguageEnum.JAVA,
	);

	if (!execDir) {
		throw new Error("Java sandbox execution directory is not available");
	}

	// Prepare java file
	console.log("Preparing Java file...");
	fs.writeFileSync(path.join(execDir, "Main.java"), code);

	let output = "";

	// Compile
	const compileResult = await docker.execCommand(
		container,
		["javac", "Main.java"],
		20000,
	);

	let isTimeout = compileResult.timeout;
	output += compileResult.output;

	if (!isTimeout) {
		// Run
		const execResult = await docker.execCommand(container, ["java", "Main"]);
		output += execResult.output;
		isTimeout = execResult.timeout;
	}

	return {
		output,
		timeout: isTimeout,
	};
};
