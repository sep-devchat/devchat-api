import { Module } from "@nestjs/common";
import { CodeBlockService } from "./code-block.service";
import { CodeBlockController } from "./code-block.controller";
import { GroupModule } from "@modules/group";
import { ChannelModule } from "@modules/channel";

@Module({
	providers: [CodeBlockService],
	exports: [CodeBlockService],
	controllers: [CodeBlockController],
	imports: [GroupModule, ChannelModule],
})
export class CodeBlockModule {}
