import { Module } from "@nestjs/common";
import { ThreadService } from "./thread.service";
import { ThreadController } from "./thread.controller";
import { ChannelModule } from "@modules/channel";
import { GroupModule } from "@modules/group";
import { SocketModule } from "@modules/socket";

@Module({
	providers: [ThreadService],
	exports: [ThreadService],
	controllers: [ThreadController],
	imports: [GroupModule, ChannelModule, SocketModule],
})
export class ThreadModule {}
