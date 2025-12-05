import { ProgrammingLanguageEnum } from "@utils";
import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";

export const javascriptExecFunction: CodeExecutionFunction = async (
	code: string,
) => {
	const docker = Docker.getInstance();
	const { container } = await docker.prepareSandbox(
		ProgrammingLanguageEnum.JAVASCRIPT,
	);

	return docker.execCommand(container, ["node", "-e", code]);
};
