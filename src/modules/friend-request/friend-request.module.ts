import { Module } from "@nestjs/common";
import { FriendRequestService } from "./friend-request.service";
import { FriendRequestController } from "./friend-request.controller";
import { UserModule } from "@modules/user";
import { NotificationModule } from "@modules/notification";

@Module({
	imports: [UserModule, NotificationModule],
	providers: [FriendRequestService],
	exports: [FriendRequestService],
	controllers: [FriendRequestController],
})
export class FriendRequestModule {}
