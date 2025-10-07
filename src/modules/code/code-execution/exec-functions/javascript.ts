import { Docker } from "../docker";
import { CodeExecutionFunction } from "../types";

export const javascriptExecFunction: CodeExecutionFunction = async (
	code: string,
) => {
	const docker = Docker.getInstance();
	const container = await docker.createExecContainer("docker.io/node:22");
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

	let buff = Buffer.from("");
	for await (const chunk of stream) {
		buff = Buffer.concat([buff, chunk]);
		// process.stdout.write(chunk);
	}
	console.log("Exec finished.");

	const execInfo = await exec.inspect();
	console.log("Exec info:");
	console.log(JSON.stringify(execInfo, null, 2));

	console.log("Stopping container...");
	container
		.stop()
		.then(() => {
			console.log("Removing container...");
			container
				.remove()
				.then(() => {
					console.log("Removed container.");
				})
				.catch((err) => {
					console.error("Error removing container:", err);
				});
		})
		.catch((err) => {
			console.error("Error stopping container:", err);
		});

	return {
		output: buff.toString(),
	};
};
