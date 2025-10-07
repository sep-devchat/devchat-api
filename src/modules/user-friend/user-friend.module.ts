import { Module } from "@nestjs/common";
import { UserFriendService } from "./user-friend.service";
import { UserFriendController } from "./user-friend.controller";
import { UserModule } from "@modules/user/user.module";

@Module({
	providers: [UserFriendService],
	imports: [UserModule],
	exports: [UserFriendService],
	controllers: [UserFriendController],
})
export class UserFriendModule {}
