import { Module } from "@nestjs/common";
import { SocketService } from "./socket.service";
import { SocketGateway } from "./socket.gateway";
import { MessageModule } from "@modules/message";

@Module({
	providers: [SocketService, SocketGateway],
	imports: [MessageModule],
})
export class SocketModule {}
