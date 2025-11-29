import { NestFactory } from "@nestjs/core";
import { SeederModule } from "./seeder.module";
import { SeederService } from "./seeder.service";
import { initializeTransactionalContext } from "typeorm-transactional";

async function main() {
	initializeTransactionalContext();

	const app = await NestFactory.createApplicationContext(SeederModule);
	const seederService = app.get(SeederService);
	await seederService.run();
	await app.close();
}

main();
