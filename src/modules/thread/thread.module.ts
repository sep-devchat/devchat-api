import { Module } from "@nestjs/common";
import { ThreadService } from "./thread.service";
import { ThreadController } from "./thread.controller";
import { ChannelModule } from "@modules/channel";
import { GroupModule } from "@modules/group";

@Module({
	providers: [ThreadService],
	exports: [ThreadService],
	controllers: [ThreadController],
	imports: [GroupModule, ChannelModule],
})
export class ThreadModule {}
