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
import { CodeBlockModule } from "@modules/code-block";
import { GroupModule } from "@modules/group";

@Module({
	imports: [
		AuthModule,
		UserModule,
		SocketModule,
		AiModule,
		AttachmentModule,
		CodeBlockModule,
		SocketModule,
		NotificationModule,
		GroupModule,
	],
	providers: [MessageService, MessageGateway],
	controllers: [MessageController],
	exports: [MessageService],
})
export class MessageModule {}
