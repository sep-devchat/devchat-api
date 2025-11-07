import { Injectable } from "@nestjs/common";
import { UpdateUserFriendRequest, UserFriendQuery } from "./dto";
import { UserFriendRepository } from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls, FriendRequestStatus, PaginationDto } from "@utils";
import { UserService } from "@modules/user/user.service";
import { SendFriendRequestDto } from "./dto/send-friend.request";
import {
	AlreadyFriendError,
	AlreadyPendingRequestError,
	FriendRequestNotFoundError,
	InvalidFriendRequestStatusError,
	OnlyReceiverError,
	SendToYourSelfError,
} from "./errors";
import { UserEntity } from "@db/entities";

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
		const existingFriendship = await this.friendRequestRepo.findOne({
			where: [
				{
					senderId: senderId,
					receiverId: receiverId,
					status: FriendRequestStatus.ACCEPTED,
				},
				{
					senderId: receiverId,
					receiverId: senderId,
					status: FriendRequestStatus.ACCEPTED,
				},
			],
		});

		if (existingFriendship) {
			throw new AlreadyFriendError();
		}

		const pendingRequestBefore = await this.friendRequestRepo.findOne({
			where: [
				{
					senderId: senderId,
					receiverId: receiverId,
					status: FriendRequestStatus.PENDING,
				},
				{
					senderId: receiverId,
					receiverId: senderId,
					status: FriendRequestStatus.PENDING,
				},
			],
		});

		if (pendingRequestBefore) {
			throw new AlreadyPendingRequestError();
		}
	}

	async sendFriendRequest(dto: SendFriendRequestDto) {
		const senderId = this.cls.get("profile").id;

		const { receiverId, message } = dto;

		// Validate before create
		await this.validateBeforeCreate(senderId, receiverId);

		const entity = this.friendRequestRepo.create({
			senderId,
			receiverId,
			message: message ?? null,
			status: FriendRequestStatus.PENDING,
		});

		await this.friendRequestRepo.insert(entity);
		return this.friendRequestRepo.findOne({
			where: { id: entity.id },
			relations: ["sender", "receiver"],
		});
	}

	// This function will do accept or declined friend request
	async updateFriendRequest(id: string, request: UpdateUserFriendRequest) {
		const { status } = request;
		const currentUserId = this.cls.get("profile").id;

		const friendRequest = await this.friendRequestRepo.findOne({
			where: [
				{ id: id, senderId: currentUserId },
				{ id: id, receiverId: currentUserId },
			],
		});

		if (status === FriendRequestStatus.PENDING) {
			throw new InvalidFriendRequestStatusError();
		}

		if (!friendRequest) {
			throw new FriendRequestNotFoundError();
		}

		// Make sure that only receiver to use this service
		// if (
		// 	(status === FriendRequestStatus.ACCEPTED ||
		// 		status === FriendRequestStatus.DECLINED) &&
		// 	friendRequest.receiverId !== currentUserId
		// ) {
		// 	throw new OnlyReceiverError();
		// }

		friendRequest.status = status;
		friendRequest.respondedAt = new Date();
		return await this.friendRequestRepo.save(friendRequest);
	}

	async removeFriend(id: string) {
		const currentUserId = this.cls.get("profile").id;

		// Ensure that only users involved in the friendship (either sender or receiver) can perform this action.
		// This prevents unauthorized users from modifying other users’ friendships.
		const friendRequest = await this.friendRequestRepo.findOne({
			where: [
				{
					id: id,
					senderId: currentUserId,
					status: FriendRequestStatus.ACCEPTED,
				},
				{
					id: id,
					receiverId: currentUserId,
					status: FriendRequestStatus.ACCEPTED,
				},
			],
		});

		if (!friendRequest) {
			throw new FriendRequestNotFoundError();
		}

		friendRequest.status = FriendRequestStatus.UNFRIEND;
		friendRequest.respondedAt = new Date();
		await this.friendRequestRepo.save(friendRequest);
	}

	async getAllFriends(query: UserFriendQuery) {
		const { page, limit } = query;
		const currentUserId = this.cls.get("profile").id;

		const [data, total] = await this.friendRequestRepo.findAndCount({
			where: [
				{ senderId: currentUserId, status: FriendRequestStatus.ACCEPTED },
				{ receiverId: currentUserId, status: FriendRequestStatus.ACCEPTED },
			],
			relations: ["sender", "receiver"],
			skip: (page - 1) * limit,
			take: limit,
			order: { createdAt: "DESC" },
		});
		const pagination = new PaginationDto(page, limit, total);
		const friends: UserEntity[] = data.map((uf) =>
			currentUserId === uf.senderId ? uf.receiver : uf.sender,
		);

		return {
			friends,
			pagination,
		};
	}
}
