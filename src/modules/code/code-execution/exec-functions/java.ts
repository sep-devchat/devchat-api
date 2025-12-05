import { ProgrammingLanguageEnum } from "@utils";
import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";

export const javaExecFunction: CodeExecutionFunction = async (code: string) => {
	const docker = Docker.getInstance();
	const sandbox = await docker.prepareSandbox(ProgrammingLanguageEnum.JAVA);

	// Prepare java file
	console.log("Preparing Java file...");
	await docker.writeFileToSandbox(sandbox, "Main.java", code);

	const { container } = sandbox;

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
