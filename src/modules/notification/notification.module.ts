import { Module } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";
import { SocketModule } from "@modules/socket";

@Module({
	imports: [SocketModule],
	providers: [NotificationService],
	exports: [NotificationService],
	controllers: [NotificationController],
})
export class NotificationModule {}
