import { Env } from "@utils";
import * as Dockerode from "dockerode";
import * as fs from "fs";
import * as path from "path";
import * as tar from "tar-stream";
import { CodeExecutionResult } from "./types";

type SandboxInstance = {
	key: string;
	runId: string;
	image: string;
	container: Dockerode.Container;
};

export type SandboxContext = {
	container: Dockerode.Container;
	runId: string;
	hostWorkspaceDir?: string;
};

export class Docker {
	private static instance: Docker;
	static getInstance() {
		if (!this.instance) this.instance = new Docker();
		return this.instance;
	}

	readonly dockerode: Dockerode;
	readonly codeExecutionDir = path.join(process.cwd(), "code-execution-tmp");
	readonly containerWorkingDir = "/app";
	private readonly useDind = Env.USE_DOCKER_DIND;
	private readonly sandboxes = new Map<string, SandboxInstance>();
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

	private buildSandboxIdentifiers(key: string) {
		const sanitized = this.sanitizeSandboxKey(key);
		return {
			runId: sanitized,
			containerName: `devchat-sbx-${sanitized}`,
		};
	}

	private ensureExecDirectory(runId: string) {
		const execDir = this.getExecDir(runId);
		if (!fs.existsSync(execDir)) {
			fs.mkdirSync(execDir, { recursive: true });
		}
		return execDir;
	}

	private resetExecDirectory(runId: string) {
		const execDir = this.getExecDir(runId);
		fs.rmSync(execDir, { recursive: true, force: true });
		fs.mkdirSync(execDir, { recursive: true });
		return execDir;
	}

	private sanitizeSandboxKey(key: string) {
		return key.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
	}

	private getSandbox(key: string): SandboxInstance {
		const sandbox = this.sandboxes.get(key);
		if (!sandbox) {
			throw new Error(`Sandbox ${key} has not been initialized`);
		}
		return sandbox;
	}

	private async ensureContainerRunning(container: Dockerode.Container) {
		const inspectInfo = await container.inspect();
		if (!inspectInfo.State?.Running) {
			await container.start();
		}
	}

	private async getExistingContainer(name: string) {
		try {
			const container = this.dockerode.getContainer(name);
			await container.inspect();
			return container;
		} catch (error) {
			return null;
		}
	}

	private async ensureSandboxContainer(
		key: string,
		image: string,
	): Promise<{ container: Dockerode.Container; runId: string }> {
		const { runId, containerName } = this.buildSandboxIdentifiers(key);
		this.ensureExecDirectory(runId);

		let container = await this.getExistingContainer(containerName);
		if (container) {
			try {
				const inspect = await container.inspect();
				const configImage = inspect.Config?.Image ?? "";
				const matchesImage = configImage.includes(image);
				if (!matchesImage) {
					await this.cleanupContainer(container, runId);
					container = null;
				}
			} catch (error) {
				console.warn(
					`Failed to inspect sandbox container ${containerName}:`,
					error,
				);
				container = null;
			}
		}

		if (!container) {
			container = await this.createExecContainer(image, runId, containerName);
			await container.start();
		} else {
			await this.ensureContainerRunning(container);
		}

		return { container, runId };
	}

	async initSandbox(key: string, image: string) {
		if (this.sandboxes.has(key)) {
			return;
		}
		const { container, runId } = await this.ensureSandboxContainer(key, image);
		this.sandboxes.set(key, { key, image, runId, container });
		console.log(`Sandbox ${key} initialized with image ${image}`);
	}

	private async resetSandboxWorkspace(
		sandbox: SandboxInstance,
	): Promise<string | undefined> {
		if (this.useDind) {
			const cleanupResult = await this.execCommand(
				sandbox.container,
				[
					"sh",
					"-c",
					`rm -rf ${this.containerWorkingDir}/* && mkdir -p ${this.containerWorkingDir}`,
				],
				5000,
			);
			if (cleanupResult.timeout) {
				throw new Error(`Timeout while cleaning sandbox ${sandbox.key}`);
			}
			return undefined;
		}

		return this.resetExecDirectory(sandbox.runId);
	}

	async prepareSandbox(key: string): Promise<SandboxContext> {
		const sandbox = this.getSandbox(key);
		await this.ensureContainerRunning(sandbox.container);
		const hostWorkspaceDir = await this.resetSandboxWorkspace(sandbox);
		return {
			container: sandbox.container,
			runId: sandbox.runId,
			hostWorkspaceDir,
		};
	}

	async writeFileToSandbox(
		sandbox: SandboxContext,
		relativePath: string,
		contents: string,
	) {
		if (sandbox.hostWorkspaceDir) {
			const targetPath = path.join(sandbox.hostWorkspaceDir, relativePath);
			const targetDir = path.dirname(targetPath);
			fs.mkdirSync(targetDir, { recursive: true });
			fs.writeFileSync(targetPath, contents);
			return;
		}

		await this.writeFileInsideContainer(
			sandbox.container,
			relativePath,
			contents,
		);
	}

	private async writeFileInsideContainer(
		container: Dockerode.Container,
		relativePath: string,
		contents: string,
	) {
		const normalizedPath = relativePath.replace(/\\/g, "/");
		const dirname = path.posix.dirname(normalizedPath);
		const pack = tar.pack();
		if (dirname && dirname !== ".") {
			pack.entry({ name: dirname, type: "directory", mode: 0o755 });
		}
		pack.entry(
			{ name: normalizedPath, type: "file", mode: 0o644 },
			Buffer.from(contents, "utf-8"),
		);
		pack.finalize();
		await new Promise<void>((resolve, reject) => {
			container.putArchive(
				pack,
				{ path: this.containerWorkingDir },
				(err?: Error) => {
					if (err) {
						reject(err);
						return;
					}
					resolve();
				},
			);
		});
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

	async createExecContainer(image: string, runId?: string, name?: string) {
		await this.pullImageIfNotExists(image);
		if (runId) {
			this.ensureExecDirectory(runId);
		}

		const cpuLimitCores = 0.5; // half a core
		const cpuPeriod = 100_000; // Docker default period (in microseconds)
		const memoryLimit = 256 * 1024 * 1024; // 256 MB
		const cpuQuota = Math.floor(cpuPeriod * cpuLimitCores);

		console.log("Creating container for image:", image);
		const container = await this.dockerode.createContainer({
			name,
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
				Binds:
					!this.useDind && runId
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
		timeoutMs = 2000,
	): Promise<CodeExecutionResult> {
		await this.ensureContainerRunning(container);
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
		for await (const chunk of stream) {
			buff = Buffer.concat([buff, chunk]);
		}
		clearTimeout(timeout);

		const execInfo = await exec.inspect();
		console.log("Exec info:");
		console.log(JSON.stringify(execInfo, null, 2));

		return {
			output: buff.toString("utf-8"),
			timeout: isTimeout,
		};
	}
}
