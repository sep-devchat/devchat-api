import { Module } from "@nestjs/common";
import { UserFriendService } from "./user-friend.service";
import { UserFriendController } from "./user-friend.controller";

@Module({
	providers: [UserFriendService],
	exports: [UserFriendService],
	controllers: [UserFriendController],
})
export class UserFriendModule {}
