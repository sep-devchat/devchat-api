import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";

export const javaExecFunction: CodeExecutionFunction = async (code: string) => {
	const docker = Docker.getInstance();

	const runId = uuidv4();
	const container = await docker.createExecContainer("openjdk:21-jdk", runId);
	await container.start();

	// Prepare java file
	const execDir = docker.getExecDir(runId);
	console.log("Preparing Java file...");
	fs.writeFileSync(`${execDir}/Main.java`, code);

	// Compile
	let exec = await container.exec({
		Cmd: ["javac", "Main.java"],
		AttachStdout: true,
		AttachStderr: true,
	});

	console.log("Compiling Java file...");
	let buff = Buffer.alloc(0);
	let stream = await exec.start({
		Tty: true,
	});
	for await (const chunk of stream) {
		buff = Buffer.concat([buff, chunk]);
	}

	// Run
	exec = await container.exec({
		Cmd: ["java", "Main"],
		AttachStdout: true,
		AttachStderr: true,
	});

	console.log("Running Java file...");
	stream = await exec.start({
		Tty: true,
	});

	for await (const chunk of stream) {
		buff = Buffer.concat([buff, chunk]);
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
