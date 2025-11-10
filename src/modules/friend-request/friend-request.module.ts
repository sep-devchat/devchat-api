import { Module } from "@nestjs/common";
import { FriendRequestService } from "./friend-request.service";
import { FriendRequestController } from "./friend-request.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
	FriendRequestEntity,
	UserEntity,
	UserFriendEntity,
} from "@db/entities";
import {
	FriendRequestRepository,
	UserRepository,
	UserFriendRepository,
} from "@db/repositories";
import { UserModule } from "@modules/user";

@Module({
	imports: [UserModule],
	providers: [FriendRequestService],
	exports: [FriendRequestService],
	controllers: [FriendRequestController],
})
export class FriendRequestModule {}
