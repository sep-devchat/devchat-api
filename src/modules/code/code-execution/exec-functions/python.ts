import { ProgrammingLanguageEnum } from "@utils";
import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";
import * as fs from "fs";
import * as path from "path";

export const pythonExecFunction: CodeExecutionFunction = async (
	code: string,
) => {
	const docker = Docker.getInstance();
	const { container, execDir } = await docker.prepareSandbox(
		ProgrammingLanguageEnum.PYTHON,
	);

	if (!execDir) {
		throw new Error("Python sandbox execution directory is not available");
	}

	// Prepare python file
	console.log("Preparing Python file...");
	fs.writeFileSync(path.join(execDir, "script.py"), code);

	const result = await docker.execCommand(container, ["python", "script.py"]);

	return result;
};
