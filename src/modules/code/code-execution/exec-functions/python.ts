import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";

export const pythonExecFunction: CodeExecutionFunction = async (
	code: string,
) => {
	const docker = Docker.getInstance();

	const runId = uuidv4();
	const container = await docker.createExecContainer("python:3.14", runId);
	await container.start();

	// Prepare python file
	const execDir = docker.getExecDir(runId);
	console.log("Preparing Python file...");
	fs.writeFileSync(`${execDir}/script.py`, code);

	const exec = await container.exec({
		Cmd: ["python", "script.py"],
		AttachStdout: true,
		AttachStderr: true,
	});

	console.log("Starting exec...");
	const stream = await exec.start({
		Tty: true,
	});

	let buff = Buffer.alloc(0);
	for await (const chunk of stream) {
		buff = Buffer.concat([buff, chunk]);
		// process.stdout.write(chunk);
	}
	console.log("Exec finished.");

	const execInfo = await exec.inspect();
	console.log("Exec info:");
	console.log(JSON.stringify(execInfo, null, 2));

	docker.cleanupContainer(container, runId);

	return {
		output: buff.toString("utf-8"),
	};
};
