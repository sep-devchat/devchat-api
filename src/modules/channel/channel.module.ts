import { Module } from "@nestjs/common";
import { ChannelService } from "./channel.service";
import { ChannelController } from "./channel.controller";
import { GroupModule } from "@modules/group";

@Module({
	providers: [ChannelService],
	exports: [ChannelService],
	controllers: [ChannelController],
	imports: [GroupModule],
})
export class ChannelModule {}
