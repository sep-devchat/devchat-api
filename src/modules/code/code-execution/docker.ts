import * as Dockerode from "dockerode";

export class Docker {
	private static instance: Docker;
	static getInstance() {
		if (!this.instance) this.instance = new Docker();
		return this.instance;
	}

	dockerode: Dockerode;
	private constructor() {
		this.dockerode = new Dockerode();
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
