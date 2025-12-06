import { Env, ProgrammingLanguageEnum } from "@utils";
import * as Dockerode from "dockerode";
import * as fs from "fs";
import * as path from "path";
import { CodeExecutionResult } from "./types";
import { imageMap } from "./image-map";

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

	getContainerName(programmingLanguage: ProgrammingLanguageEnum) {
		return `devchat-${programmingLanguage}`;
	}

	async prepareContainer(programmingLanguage: ProgrammingLanguageEnum) {
		const image = imageMap[programmingLanguage];
		const containers = await this.dockerode.listContainers({
			all: true,
			filters: JSON.stringify({
				name: [this.getContainerName(programmingLanguage)],
			}),
		});

		const containerInfo = containers.filter((c) =>
			c.Names.includes(`/${this.getContainerName(programmingLanguage)}`),
		)[0];

		if (containerInfo) {
			const container = this.dockerode.getContainer(containerInfo.Id);
			const info = await container.inspect();
			if (!info.State.Running) {
				await container.start();
			}
			return container;
		}

		const container = await this.createExecContainer(
			this.getContainerName(programmingLanguage),
			image,
		);
		await container.start();
		return container;
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

	async createExecContainer(containerName: string, image: string) {
		await this.pullImageIfNotExists(image);

		const cpuLimitCores = 0.5; // half a core
		const cpuPeriod = 100_000; // Docker default period (in microseconds)
		const memoryLimit = 256 * 1024 * 1024; // 256 MB
		const cpuQuota = Math.floor(cpuPeriod * cpuLimitCores);

		console.log("Creating container for image:", image);
		const container = await this.dockerode.createContainer({
			name: containerName,
			Image: image,
			AttachStdout: true,
			AttachStderr: true,
			Tty: true,
			Env: ["FORCE_COLOR=0", "NO_COLOR=1"],
			WorkingDir: this.containerWorkingDir,
			HostConfig: {
				Memory: memoryLimit,
				MemorySwap: memoryLimit, // disable swap by matching memory limit
				CpuPeriod: cpuPeriod,
				CpuQuota: cpuQuota,
				CpuShares: 128,
				PidsLimit: 64,
				Binds: [`${this.codeExecutionDir}:${this.containerWorkingDir}`],
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

	async prepareExecDir(runId: string) {
		const execDir = this.getExecDir(runId);
		if (fs.existsSync(execDir)) {
			fs.rmSync(execDir, { recursive: true, force: true });
		}
		fs.mkdirSync(execDir, { recursive: true });
	}

	async cleanupExecDir(runId: string) {
		const execDir = this.getExecDir(runId);
		if (fs.existsSync(execDir)) {
			fs.rmSync(execDir, { recursive: true, force: true });
		}
	}

	async execCommand(
		container: Dockerode.Container,
		runId: string,
		cmd: string[],
		timeoutMs: number = 2000,
		outputLimitBytes = 200_000,
	): Promise<CodeExecutionResult> {
		const exec = await container.exec({
			Cmd: cmd,
			AttachStdout: true,
			AttachStderr: true,
			Tty: true,
			WorkingDir: this.containerWorkingDir + "/" + runId,
		});

		console.log("Starting exec...");
		const stream = await exec.start({
			Tty: true,
		});

		let isTimeout = false;
		const timeout = setTimeout(async () => {
			console.log("Exec timeout reached. Stopping exec...");
			try {
				isTimeout = true;
				await container.kill();
				console.log("Exec stopped due to timeout.");
			} catch (err) {
				console.error("Error stopping exec on timeout:", err);
			}
		}, timeoutMs);
		let buff = Buffer.alloc(0);
		let truncated = false;
		for await (const chunk of stream) {
			if (buff.length >= outputLimitBytes) {
				truncated = true;
				break;
			}
			const bufferChunk = Buffer.isBuffer(chunk)
				? chunk
				: Buffer.from(chunk as Buffer);
			const remaining = outputLimitBytes - buff.length;
			if (bufferChunk.length <= remaining) {
				buff = Buffer.concat([buff, bufferChunk]);
			} else {
				buff = Buffer.concat([buff, bufferChunk.subarray(0, remaining)]);
				truncated = true;
				break;
			}
		}
		clearTimeout(timeout);

		const execInfo = await exec.inspect();
		console.log("Exec info:");
		console.log(JSON.stringify(execInfo, null, 2));

		let output = buff.toString("utf-8");
		if (truncated) {
			output += "\n[execution output truncated]\n";
		}

		return {
			output,
			timeout: isTimeout,
		};
	}
}
