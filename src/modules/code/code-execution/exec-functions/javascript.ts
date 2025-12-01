import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";

export const javascriptExecFunction: CodeExecutionFunction = async (
	code: string,
) => {
	const docker = Docker.getInstance();
	const container = await docker.createExecContainer("node:22");
	await container.start();

	const result = await docker.execCommand(container, ["node", "-e", code]);

	docker.cleanupContainer(container);

	return result;
};
