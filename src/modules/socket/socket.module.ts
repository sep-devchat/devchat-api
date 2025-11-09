import { Module } from "@nestjs/common";
import { SocketService } from "./socket.service";
import { SocketGateway } from "./socket.gateway";
import { AuthModule } from "@modules/auth";
import { UserModule } from "@modules/user";
import { AiModule } from "@modules/ai";

@Module({
	providers: [SocketService, SocketGateway],
	imports: [UserModule, AuthModule, AiModule],
	exports: [SocketService],
})
export class SocketModule {}
