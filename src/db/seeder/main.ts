import { NestFactory } from "@nestjs/core";
import { SeederModule } from "./seeder.module";
import { SeederService } from "./services/seeder.service";
import { initializeTransactionalContext } from "typeorm-transactional";

async function main() {
	initializeTransactionalContext();
	const app = await NestFactory.create(SeederModule);
	const seederService = app.get(SeederService);
	await seederService.run();
	// await seederService.init();
	await app.close();
}

main();
