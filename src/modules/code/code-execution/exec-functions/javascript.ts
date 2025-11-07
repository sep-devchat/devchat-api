import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";

export const javascriptExecFunction: CodeExecutionFunction = async (
	code: string,
) => {
	const docker = Docker.getInstance();
	const container = await docker.createExecContainer("node:22");
	await container.start();

	const exec = await container.exec({
		Cmd: ["node", "-e", code],
		AttachStdout: true,
		AttachStderr: true,
		Tty: true,
	});

	console.log("Starting exec...");
	const stream = await exec.start({
		Tty: true,
	});

	let buff = Buffer.alloc(0);
	for await (const chunk of stream) {
		buff = Buffer.concat([buff, chunk]);
	}

	const execInfo = await exec.inspect();
	console.log("Exec info:");
	console.log(JSON.stringify(execInfo, null, 2));

	console.log("Stopping container...");
	docker.cleanupContainer(container);

	return {
		output: buff.toString("utf-8"),
	};
};
