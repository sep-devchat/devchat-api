import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Env } from "@utils";
import helmet from "helmet";
import { initializeTransactionalContext } from "typeorm-transactional";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import * as timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

async function bootstrap() {
	initializeTransactionalContext();

	const app = await NestFactory.create(AppModule);
	app.use(cookieParser());
	app.setGlobalPrefix("/api");
	app.enableCors({ origin: "*" });

	if (Env.ENABLE_SWAGGER) {
		const config = new DocumentBuilder()
			.setTitle("API Documentation")
			.setDescription("API Description")
			.setVersion("1.0")
			.addBearerAuth()
			.build();
		const document = SwaggerModule.createDocument(app, config);
		SwaggerModule.setup("api/docs", app, document);
	}
	app.use(helmet());

	await app.listen(Env.LISTEN_PORT);
}
bootstrap();
