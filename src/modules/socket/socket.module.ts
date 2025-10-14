import { Module } from "@nestjs/common";
import { SocketService } from "./socket.service";
import { SocketGateway } from "./socket.gateway";
import { AuthModule } from "@modules/auth";
import { UserModule } from "@modules/user";

@Module({
	providers: [SocketService, SocketGateway],
	imports: [UserModule, AuthModule],
})
export class SocketModule {}
