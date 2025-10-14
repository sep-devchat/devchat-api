import { Module } from "@nestjs/common";
import { AiService } from "./ai.service";
import { AiController } from "./ai.controller";
import { DbModule } from "@db";

@Module({
	imports: [DbModule],
	controllers: [AiController],
	providers: [AiService],
	exports: [AiService],
})
export class AiModule {}
