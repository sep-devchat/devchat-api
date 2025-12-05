import { ProgrammingLanguageEnum } from "@utils";
import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";
import { v4 as uuidv4 } from "uuid";

export const javascriptExecFunction: CodeExecutionFunction = async (
	code: string,
) => {
	const docker = Docker.getInstance();
	const runId = uuidv4();
	const container = await docker.prepareContainer(
		ProgrammingLanguageEnum.JAVASCRIPT,
	);

	await docker.prepareExecDir(runId);
	const result = await docker.execCommand(container, runId, [
		"node",
		"-e",
		code,
	]);
	await docker.cleanupExecDir(runId);

	return result;
};
