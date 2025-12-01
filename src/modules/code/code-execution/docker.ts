import { Env } from "@utils";
import * as Dockerode from "dockerode";
import * as fs from "fs";
import * as path from "path";
import { CodeExecutionResult } from "./types";

export class Docker {
	private static instance: Docker;
	static getInstance() {
		if (!this.instance) this.instance = new Docker();
		return this.instance;
	}

	readonly dockerode: Dockerode;
	readonly codeExecutionDir = path.join(process.cwd(), "code-execution-tmp");
	readonly containerWorkingDir = "/app";
	private constructor() {
		this.dockerode = new Dockerode(
			Env.USE_DOCKER_DIND
				? {
						host: Env.DOCKER_DIND_HOST,
						port: Env.DOCKER_DIND_PORT,
						protocol: "https",
						ca: fs.readFileSync("/certs/ca.pem"),
						cert: fs.readFileSync("/certs/cert.pem"),
						key: fs.readFileSync("/certs/key.pem"),
					}
				: undefined,
		);
	}

	imageNameToContainerName(image: string) {
		return image.replace(/[:/]/g, "-");
	}

	getExecDir(runId: string) {
		return `${this.codeExecutionDir}/${runId}`;
	}

	async pullImageIfNotExists(image: string) {
		console.log("Checking for image:", image);
		const images = await this.dockerode.listImages({
			filters: { reference: [image] },
		});
		console.log("Found images:", images.length);

		if (images.length === 0) {
			console.log("Pulling image:", image);
			const stream = await this.dockerode.pull(`docker.io/${image}`);
			for await (const chunk of stream) {
				process.stdout.write(chunk);
			}
			console.log("Pulled image:", image);
		}
	}

	async createExecContainer(image: string, runId?: string) {
		await this.pullImageIfNotExists(image);

		console.log("Creating container for image:", image);
		const container = await this.dockerode.createContainer({
			Image: image,
			AttachStdout: true,
			AttachStderr: true,
			Tty: true,
			Env: ["FORCE_COLOR=0", "NO_COLOR=1"],
			WorkingDir: this.containerWorkingDir,
			HostConfig: {
				Memory: 256 * 1024 * 1024, // 256 MB,
				MemorySwap: 0,
				NanoCpus: 500_000_000, // limit to half a vCPU
				Binds: runId
					? [`${this.getExecDir(runId)}:${this.containerWorkingDir}`]
					: undefined,
			},
		});
		console.log("Created container for image:", image);

		return container;
	}

	async cleanupContainer(container: Dockerode.Container, runId?: string) {
		console.log("Stopping container...");
		try {
			await container.stop();
		} catch (err) {
			console.error("Error stopping container:", err);
			console.log(err);
		}

		console.log("Removing container...");
		try {
			await container.remove();
			console.log("Removed container.");
		} catch (err) {
			console.error("Error removing container:", err);
			console.log(err);
		}

		if (runId) {
			const execDir = this.getExecDir(runId);
			console.log("Removing exec dir:", execDir);
			try {
				fs.rmSync(execDir, { recursive: true, force: true });
				console.log("Removed exec dir.");
			} catch (err) {
				console.error("Error removing exec dir:", err);
				console.log(err);
			}
		}
	}

	async execCommand(
		container: Dockerode.Container,
		cmd: string[],
	): Promise<CodeExecutionResult> {
		const exec = await container.exec({
			Cmd: cmd,
			AttachStdout: true,
			AttachStderr: true,
			Tty: true,
		});

		console.log("Starting exec...");
		const stream = await exec.start({
			Tty: true,
		});

		const timeout = setTimeout(async () => {
			console.log("Exec timeout reached. Stopping exec...");
			try {
				await container.kill();
				console.log("Exec stopped due to timeout.");
			} catch (err) {
				console.error("Error stopping exec on timeout:", err);
			}
		}, 2000);
		let buff = Buffer.alloc(0);
		for await (const chunk of stream) {
			buff = Buffer.concat([buff, chunk]);
		}
		clearTimeout(timeout);

		const execInfo = await exec.inspect();
		console.log("Exec info:");
		console.log(JSON.stringify(execInfo, null, 2));

		return {
			output: buff.toString("utf-8"),
		};
	}
}
