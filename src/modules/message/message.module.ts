import { Module } from "@nestjs/common";
import { MessageService } from "./message.service";
import { MessageController } from "./message.controller";
import { GroupModule } from "@modules/group";
import { ChannelModule } from "@modules/channel";

@Module({
	providers: [MessageService],
	exports: [MessageService],
	controllers: [MessageController],
	imports: [GroupModule, ChannelModule],
})
export class MessageModule {}
