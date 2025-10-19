import { Module } from "@nestjs/common";
import { CodeBlockService } from "./code-block.service";
import { CodeBlockController } from "./code-block.controller";
import { CodeModule } from "@modules/code";

@Module({
	providers: [CodeBlockService],
	exports: [CodeBlockService],
	controllers: [CodeBlockController],
})
export class CodeBlockModule {}
