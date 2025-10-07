import { Env } from "@utils";
import * as Dockerode from "dockerode";
import * as fs from "fs";

export class Docker {
	private static instance: Docker;
	static getInstance() {
		if (!this.instance) this.instance = new Docker();
		return this.instance;
	}

	dockerode: Dockerode;
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

	async pullImageIfNotExists(image: string) {
		console.log("Checking for image:", image);
		const images = await this.dockerode.listImages({
			filters: { reference: [image] },
		});
		console.log("Found images:", images.length);

		if (images.length === 0) {
			console.log("Pulling image:", image);
			await this.dockerode.pull(image);
			console.log("Pulled image:", image);
		}
	}

	async createExecContainer(image: string) {
		await this.pullImageIfNotExists(image);

		console.log("Creating container for image:", image);
		const container = await this.dockerode.createContainer({
			Image: image,
			AttachStdout: true,
			AttachStderr: true,
			Tty: true,
		});
		console.log("Created container for image:", image);

		return container;
	}
}
