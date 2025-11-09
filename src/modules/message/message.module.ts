import { Module } from "@nestjs/common";
import { MessageService } from "./message.service";
import { MessageGateway } from "./message.gateway";
import { AuthModule } from "@modules/auth";
import { UserModule } from "@modules/user";
import { SocketModule } from "@modules/socket";

@Module({
	imports: [AuthModule, UserModule, SocketModule],
	providers: [MessageService, MessageGateway],
	exports: [MessageService],
})
export class MessageModule {}
