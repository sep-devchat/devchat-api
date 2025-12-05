import { ProgrammingLanguageEnum } from "@utils";
import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";

export const pythonExecFunction: CodeExecutionFunction = async (
	code: string,
) => {
	const docker = Docker.getInstance();
	const sandbox = await docker.prepareSandbox(ProgrammingLanguageEnum.PYTHON);

	// Prepare python file
	console.log("Preparing Python file...");
	await docker.writeFileToSandbox(sandbox, "script.py", code);

	const result = await docker.execCommand(sandbox.container, [
		"python",
		"script.py",
	]);

	return result;
};
