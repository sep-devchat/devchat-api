import { Module } from "@nestjs/common";
import { MessageService } from "./message.service";
import { MessageGateway } from "./message.gateway";
import { MessageController } from "./message.controller";
import { AuthModule } from "@modules/auth";
import { UserModule } from "@modules/user";
import { SocketModule } from "@modules/socket";
import { AiModule } from "@modules/ai";
import { AttachmentModule } from "@modules/attachment";
import { NotificationModule } from "@modules/notification";

@Module({
	imports: [
		AuthModule,
		UserModule,
		SocketModule,
		AiModule,
		AttachmentModule,
		SocketModule,
		NotificationModule,
	],
	providers: [MessageService, MessageGateway],
	controllers: [MessageController],
	exports: [MessageService],
})
export class MessageModule {}
