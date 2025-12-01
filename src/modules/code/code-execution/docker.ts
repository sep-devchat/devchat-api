import { Env } from "@utils";
import * as Dockerode from "dockerode";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { CodeExecutionResult } from "./types";

type Sandbox = {
	container: Dockerode.Container;
	runId: string;
	busy: boolean;
	image: string;
};

type PendingRequest = {
	fulfill: (sandbox: Sandbox) => void;
	reject: (error: Error) => void;
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
	private readonly sandboxPools = new Map<string, Sandbox[]>();
	private readonly pendingRequests = new Map<string, PendingRequest[]>();
	private readonly maxSandboxPerImage = Math.max(
		1,
		Env.CODE_RUNNER_SANDBOX_POOL_SIZE || 2,
	);
	private readonly sandboxAcquireTimeoutMs = 5000;

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

		if (!fs.existsSync(this.codeExecutionDir)) {
			fs.mkdirSync(this.codeExecutionDir, { recursive: true });
		}
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

	private ensureExecDir(runId: string) {
		const dir = this.getExecDir(runId);
		fs.mkdirSync(dir, { recursive: true });
		return dir;
	}

	async createExecContainer(image: string, runId?: string) {
		await this.pullImageIfNotExists(image);

		if (runId) {
			this.ensureExecDir(runId);
		}

		const cpuLimitCores = 0.5; // half a core
		const cpuPeriod = 100_000; // Docker default period (in microseconds)
		const memoryLimit = 256 * 1024 * 1024; // 256 MB
		const cpuQuota = Math.floor(cpuPeriod * cpuLimitCores);

		console.log("Creating container for image:", image);
		const container = await this.dockerode.createContainer({
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
				Binds: runId
					? [`${this.getExecDir(runId)}:${this.containerWorkingDir}`]
					: undefined,
			},
		});
		console.log("Created container for image:", image);

		return container;
	}

	private async createSandbox(image: string): Promise<Sandbox> {
		const runId = randomUUID();
		const container = await this.createExecContainer(image, runId);
		await container.start();
		return { container, runId, busy: false, image };
	}

	private getOrCreatePool(image: string) {
		let pool = this.sandboxPools.get(image);
		if (!pool) {
			pool = [];
			this.sandboxPools.set(image, pool);
		}
		return pool;
	}

	private getOrCreatePendingQueue(image: string) {
		let pending = this.pendingRequests.get(image);
		if (!pending) {
			pending = [];
			this.pendingRequests.set(image, pending);
		}
		return pending;
	}

	private removePendingRequest(image: string, request: PendingRequest) {
		const queue = this.pendingRequests.get(image);
		if (!queue) return;
		const idx = queue.indexOf(request);
		if (idx >= 0) {
			queue.splice(idx, 1);
		}
		if (queue.length === 0) {
			this.pendingRequests.delete(image);
		}
	}

	private async findAvailableSandbox(image: string): Promise<Sandbox | null> {
		const pool = this.getOrCreatePool(image);
		const available = pool.find((sb) => !sb.busy);
		if (available) {
			available.busy = true;
			return available;
		}
		if (pool.length < this.maxSandboxPerImage) {
			const sandbox = await this.createSandbox(image);
			sandbox.busy = true;
			pool.push(sandbox);
			return sandbox;
		}
		return null;
	}

	async acquireSandbox(image: string): Promise<Sandbox> {
		const immediate = await this.findAvailableSandbox(image);
		if (immediate) {
			return immediate;
		}

		return new Promise((resolve, reject) => {
			let timeoutId: NodeJS.Timeout;
			const request: PendingRequest = {
				fulfill: (sandbox) => {
					clearTimeout(timeoutId);
					resolve(sandbox);
				},
				reject: (error) => {
					clearTimeout(timeoutId);
					reject(error);
				},
			};
			timeoutId = setTimeout(() => {
				this.removePendingRequest(image, request);
				request.reject(
					new Error(
						`Timed out after ${this.sandboxAcquireTimeoutMs}ms waiting for sandbox of ${image}`,
					),
				);
			}, this.sandboxAcquireTimeoutMs);
			this.getOrCreatePendingQueue(image).push(request);
		});
	}

	async releaseSandbox(sandbox: Sandbox) {
		this.resetExecDir(sandbox.runId);
		const queue = this.pendingRequests.get(sandbox.image);
		if (queue && queue.length > 0) {
			const next = queue.shift();
			if (next) {
				sandbox.busy = true;
				next.fulfill(sandbox);
				if (queue.length === 0) {
					this.pendingRequests.delete(sandbox.image);
				}
				return;
			}
		}
		sandbox.busy = false;
	}

	async destroySandbox(image: string, sandbox: Sandbox) {
		await this.cleanupContainer(sandbox.container, sandbox.runId);
		const pool = this.sandboxPools.get(image);
		if (pool) {
			const idx = pool.indexOf(sandbox);
			if (idx >= 0) {
				pool.splice(idx, 1);
			}
		}
		await this.fulfillPendingRequests(image);
	}

	private resetExecDir(runId: string) {
		const execDir = this.getExecDir(runId);
		try {
			if (fs.existsSync(execDir)) {
				fs.rmSync(execDir, { recursive: true, force: true });
			}
			fs.mkdirSync(execDir, { recursive: true });
		} catch (err) {
			console.error("Error resetting exec dir:", err);
		}
	}

	private async fulfillPendingRequests(image: string) {
		const queue = this.pendingRequests.get(image);
		if (!queue || queue.length === 0) return;
		while (queue.length) {
			const sandbox = await this.findAvailableSandbox(image);
			if (!sandbox) {
				break;
			}
			const next = queue.shift();
			if (next) {
				next.fulfill(sandbox);
			}
		}
		if (queue.length === 0) {
			this.pendingRequests.delete(image);
		}
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
		};
	}
}
