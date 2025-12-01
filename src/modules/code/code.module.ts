import { Module } from "@nestjs/common";
import { CodeService } from "./code.service";
import { CodeController } from "./code.controller";
import { AiModule } from "@modules/ai";

@Module({
	providers: [CodeService],
	exports: [CodeService],
	controllers: [CodeController],
	imports: [AiModule],
})
export class CodeModule {}
