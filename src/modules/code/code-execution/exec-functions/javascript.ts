import { ProgrammingLanguageEnum } from "@utils";
import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";

export const javascriptExecFunction: CodeExecutionFunction = async (
	code: string,
) => {
	const docker = Docker.getInstance();
	const sandbox = await docker.prepareSandbox(
		ProgrammingLanguageEnum.JAVASCRIPT,
	);

	return docker.execCommand(sandbox.container, ["node", "-e", code]);
};
