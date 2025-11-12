import { Injectable, Logger } from "@nestjs/common";
import {
	CreateFriendRequestDto,
	UpdateFriendRequestRequest,
	FriendRequestQuery,
} from "./dto";
import {
	FriendRequestRepository,
	UserRepository,
	UserFriendRepository,
} from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls, PaginationDto } from "@utils";
import { FindOptionsWhere, ILike, Or } from "typeorm";
import { FriendRequestEntity } from "@db/entities/friend-request.entity";
import {
	FriendRequestNotFoundError,
	FriendRequestAlreadyExistsError,
	CannotSendToSelfError,
	AlreadyFriendsError,
} from "./errors";
import { UserService } from "@modules/user";
import { NotificationService } from "@modules/notification";

@Injectable()
export class FriendRequestService {
	private readonly logger = new Logger(FriendRequestService.name);

	constructor(
		private readonly repo: FriendRequestRepository,
		private readonly userFriendRepo: UserFriendRepository,
		private readonly userService: UserService,
		private readonly cls: ClsService<DevChatCls>,
		private readonly notificationService: NotificationService,
	) {}

	async validateBeforeCreate(fromUserId: string, toUserId: string) {
		// Cannot send friend request to self
		if (fromUserId === toUserId) {
			throw new CannotSendToSelfError();
		}

		// Check if target user exists
		await this.userService.findById(toUserId);

		// Check if they are already friends (check both directions since only one record exists)
		const friendship = await this.userFriendRepo.findOne({
			where: [
				{
					userId: fromUserId,
					friendId: toUserId,
				},
				{
					userId: toUserId,
					friendId: fromUserId,
				},
			],
		});

		if (friendship) {
			throw new AlreadyFriendsError();
		}

		// Check if friend request already exists
		const existingRequest = await this.repo.findOne({
			where: [
				{
					fromUserId,
					toUserId,
				},
				{
					fromUserId: toUserId,
					toUserId: fromUserId,
				},
			],
		});

		if (existingRequest) {
			throw new FriendRequestAlreadyExistsError();
		}
	}

	async createOne(dto: CreateFriendRequestDto) {
		const userId = this.cls.get("profile").id;

		await this.validateBeforeCreate(userId, dto.toUserId);

		const friendRequest = this.repo.create({
			fromUserId: userId,
			toUserId: dto.toUserId,
			message: dto.message,
			updatedAt: new Date(),
			createdBy: userId,
		});

		await this.repo.insert(friendRequest);

		// Send notification to the recipient
		await this.notificationService.createOne({
			toUserId: dto.toUserId,
			title: "New Friend Request",
			content: `You have a new friend request`,
			notificationSource: "/chat/friend?tab=pending",
		});

		// Return with relations
		return await this.repo.findOne({
			where: { id: friendRequest.id },
			relations: ["fromUser", "toUser"],
		});
	}

	async updateOne(id: string, dto: UpdateFriendRequestRequest) {
		const existingFriendRequest = await this.findOne(id);
		const userId = this.cls.get("profile").id;

		// Only allow the sender or recipient to update
		if (
			existingFriendRequest.fromUserId !== userId &&
			existingFriendRequest.toUserId !== userId
		) {
			throw new FriendRequestNotFoundError();
		}

		await this.repo.update(id, {
			...dto,
			updatedAt: new Date(),
		});

		// Return updated friend request with relations
		return await this.repo.findOne({
			where: { id },
			relations: ["fromUser", "toUser"],
		});
	}

	private async createFriendship(fromUserId: string, toUserId: string) {
		this.logger.log(
			`Creating single friendship record with accepting user ${toUserId} as userId and sender ${fromUserId} as friendId`,
		);

		// Create only one record where accepting user is userId and sender is friendId
		const friendship = this.userFriendRepo.create({
			userId: toUserId, // The user who accepted the request
			friendId: fromUserId, // The user who sent the request
			createdAt: new Date(),
		});

		await this.userFriendRepo.save(friendship);
		this.logger.log(`Single friendship record created successfully`);
	}

	async findMany(query: FriendRequestQuery) {
		const userId = this.cls.get("profile").id;
		const { page, limit, search } = query;

		// Build where conditions based on type
		let where: FindOptionsWhere<FriendRequestEntity>[] = [];

		// type === "all"
		where = [{ fromUserId: userId }, { toUserId: userId }];

		// Apply additional filters
		const findOptions = {
			where,
			relations: ["fromUser", "toUser"],
			skip: (page - 1) * limit,
			take: limit,
			order: { createdAt: "DESC" as const },
		};

		// Handle search separately if needed
		if (search) {
			const searchConditions = where.flatMap((condition) => [
				{
					...condition,
					fromUser: { username: ILike(`%${search}%`) },
				},
				{
					...condition,
					toUser: { username: ILike(`%${search}%`) },
				},
			]);

			const [data, total] = await this.repo.findAndCount({
				where: searchConditions,
				relations: findOptions.relations,
				skip: findOptions.skip,
				take: findOptions.take,
				order: findOptions.order,
			});

			const pagination = new PaginationDto(page, limit, total);
			return { data, pagination };
		}

		// Regular find without search
		const [data, total] = await this.repo.findAndCount(findOptions);

		const pagination = new PaginationDto(page, limit, total);

		return {
			data,
			pagination,
		};
	}

	async findOne(id: string) {
		const userId = this.cls.get("profile").id;
		console.debug(userId);
		const friendRequest = await this.repo.findOne({
			where: [
				{ id, fromUserId: userId },
				{ id, toUserId: userId },
			],
			relations: ["fromUser", "toUser"],
		});

		if (!friendRequest) {
			throw new FriendRequestNotFoundError();
		}

		return friendRequest;
	}

	async deleteOne(id: string) {
		const existingFriendRequest = await this.findOne(id);
		const userId = this.cls.get("profile").id;

		// Only allow the sender to delete/cancel the request
		if (existingFriendRequest.fromUserId !== userId) {
			throw new FriendRequestNotFoundError();
		}

		await this.repo.delete(id);

		return { message: "Friend request deleted successfully" };
	}

	// Additional utility methods
	async cancelFriendRequest(id: string) {
		const existingFriendRequest = await this.findOne(id);
		const userId = this.cls.get("profile").id;

		// Only allow the sender to cancel
		if (existingFriendRequest.fromUserId !== userId) {
			throw new FriendRequestNotFoundError();
		}

		this.logger.log(
			`Canceling friend request ${id} from user ${userId} to ${existingFriendRequest.toUserId}`,
		);

		await this.repo.delete(id);

		this.logger.log(`Friend request ${id} cancelled successfully`);

		return { message: "Friend request cancelled successfully" };
	}
	async getRequestsCount() {
		const userId = this.cls.get("profile").id;

		return await this.repo.count({
			where: {
				toUserId: userId,
			},
		});
	}

	// Action-based methods for explicit status updates
	async acceptFriendRequest(id: string) {
		const existingFriendRequest = await this.findOne(id);
		const userId = this.cls.get("profile").id;

		// Only allow the recipient to accept
		if (existingFriendRequest.toUserId !== userId) {
			throw new FriendRequestNotFoundError();
		}

		this.logger.log(
			`Accepting friend request ${id} between users ${existingFriendRequest.fromUserId} and ${userId}`,
		);

		try {
			// Create bidirectional friendship
			await this.createFriendship(existingFriendRequest.fromUserId, userId);

			// Delete the friend request record
			await this.repo.delete(id);

			await this.notificationService.createOne({
				toUserId: existingFriendRequest.fromUserId,
				title: "Friend Request Accepted",
				content: `Your friend request has been accepted`,
				notificationSource: "/chat/friend?tab=all",
			});

			this.logger.log(
				`Friend request ${id} accepted, friendship created, and request deleted`,
			);
			return { message: "Friend request accepted successfully" };
		} catch (error) {
			this.logger.error(
				`Failed to accept friend request ${id}: ${error.message}`,
			);
			throw error;
		}
	}

	async declineFriendRequest(id: string) {
		const existingFriendRequest = await this.findOne(id);
		const userId = this.cls.get("profile").id;

		// Only allow the recipient to decline
		if (existingFriendRequest.toUserId !== userId) {
			throw new FriendRequestNotFoundError();
		}

		this.logger.log(
			`Declining friend request ${id} between users ${existingFriendRequest.fromUserId} and ${userId}`,
		);

		// Simply delete the friend request record
		await this.repo.delete(id);

		this.logger.log(`Friend request ${id} declined and deleted`);
		return { message: "Friend request declined successfully" };
	}
}
