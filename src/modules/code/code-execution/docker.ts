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

	private async findExistingContainer(containerName: string): Promise<{
		container: Dockerode.Container;
		info: Dockerode.ContainerInspectInfo;
	} | null> {
		try {
			const containers = await this.dockerode.listContainers({
				all: true,
				filters: JSON.stringify({
					name: [containerName],
				}),
			});

			const exactMatch = containers.find((c) =>
				c.Names.some((name) => name.replace(/^\//, "") === containerName),
			);

			if (!exactMatch) {
				return null;
			}

			const container = this.dockerode.getContainer(exactMatch.Id);
			const info = await container.inspect();
			return { container, info };
		} catch (error) {
			console.error("Error finding container", error);
			return null;
		}
	}

	private async startNewContainer(containerName: string, image: string) {
		const container = await this.createExecContainer(containerName, image);
		await container.start();
		return container;
	}

	private isSameImage(currentImage: string | undefined, expectedImage: string) {
		if (!currentImage) {
			return false;
		}
		return (
			currentImage === expectedImage ||
			currentImage.endsWith(`/${expectedImage}`)
		);
	}

	async prepareContainer(programmingLanguage: ProgrammingLanguageEnum) {
		const image = imageMap[programmingLanguage];
		const containerName = this.getContainerName(programmingLanguage);
		console.log(
			`[Docker] Preparing container ${containerName} for ${programmingLanguage} using image ${image}`,
		);
		const existing = await this.findExistingContainer(containerName);

		if (existing) {
			const { container, info } = existing;
			console.log(
				`[Docker] Found existing container ${containerName} (running=${info.State.Running}) with image ${info.Config?.Image}`,
			);
			if (!this.isSameImage(info.Config?.Image, image)) {
				console.log(
					`[Docker] Container ${containerName} image mismatch. Expected ${image} but found ${info.Config?.Image}. Recreating...`,
				);
				await this.cleanupContainer(container);
				return this.startNewContainer(containerName, image);
			}
			if (!info.State.Running) {
				console.log(`[Docker] Starting stopped container ${containerName}`);
				await container.start();
			}
			console.log(`[Docker] Reusing container ${containerName}`);
			return container;
		}

		console.log(
			`[Docker] No existing container found for ${containerName}. Creating new one...`,
		);
		return this.startNewContainer(containerName, image);
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
		outputLimitChars = 10_000,
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
		let output = "";
		let truncated = false;
		for await (const chunk of stream) {
			if (output.length >= outputLimitChars) {
				truncated = true;
				break;
			}
			const textChunk = Buffer.isBuffer(chunk)
				? chunk.toString("utf-8")
				: Buffer.from(chunk as Buffer).toString("utf-8");
			const remaining = outputLimitChars - output.length;
			if (textChunk.length <= remaining) {
				output += textChunk;
			} else {
				output += textChunk.slice(0, remaining);
				truncated = true;
				break;
			}
		}
		clearTimeout(timeout);

		const execInfo = await exec.inspect();
		console.log("Exec info:");
		console.log(JSON.stringify(execInfo, null, 2));

		if (truncated) {
			output += "\n[execution output truncated]\n";
		}

		return {
			output,
			timeout: isTimeout,
		};
	}
}
