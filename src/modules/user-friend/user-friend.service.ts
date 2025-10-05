import { Injectable } from "@nestjs/common";
import { UpdateUserFriendRequest, UserFriendQuery } from "./dto";
import { UserFriendRepository } from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";
import { UserService } from "@modules/user/user.service";
import { SendFriendRequestDto } from "./dto/send-friend.request";
import { SendToYourSelfError } from "./errors";

@Injectable()
export class UserFriendService {
	constructor(
		private readonly friendRequestRepo: UserFriendRepository,
		private readonly cls: ClsService<DevChatCls>,
		private readonly userService: UserService,
	) {}

	async validateBeforeCreate(senderId: string, receiverId: string) {
		if (senderId === receiverId) {
			throw new SendToYourSelfError();
		}

		// Validate if receiver exist
		await this.userService.findById(receiverId);

		// Validate if a sender and receiver are friend
		const existingFriendship = this.friendRequestRepo.findOne({
			where: { sender: { id: senderId } },
		});
	}

	async sendFriendRequest(dto: SendFriendRequestDto) {
		const senderId = this.cls.get("profile").id;

		const { receiverId, message } = dto;

		// Validate before create
		this.validateBeforeCreate(senderId, receiverId);
	}
}
