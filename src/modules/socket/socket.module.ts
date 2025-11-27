import { Module } from "@nestjs/common";
import { SocketService } from "./socket.service";
import { SocketGateway } from "./socket.gateway";
import { AuthModule } from "@modules/auth";
import { UserModule } from "@modules/user";
import { AiModule } from "@modules/ai";
import { ChatPresenceService } from "./chat-presence.service";

@Module({
	providers: [SocketService, SocketGateway, ChatPresenceService],
	imports: [UserModule, AuthModule, AiModule],
	exports: [SocketService, ChatPresenceService],
})
export class SocketModule {}
