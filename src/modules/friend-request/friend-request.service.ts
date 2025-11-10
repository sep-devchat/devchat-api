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
import { DevChatCls, PaginationDto, FriendRequestStatus } from "@utils";
import { FindOptionsWhere, ILike, Or } from "typeorm";
import { FriendRequestEntity } from "@db/entities/friend-request.entity";
import {
	FriendRequestNotFoundError,
	FriendRequestAlreadyExistsError,
	CannotSendToSelfError,
	AlreadyFriendsError,
} from "./errors";
import { UserService } from "@modules/user";

@Injectable()
export class FriendRequestService {
	private readonly logger = new Logger(FriendRequestService.name);

	constructor(
		private readonly repo: FriendRequestRepository,
		private readonly userFriendRepo: UserFriendRepository,
		private readonly userService: UserService,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	async validateBeforeCreate(fromUserId: string, toUserId: string) {
		// Cannot send friend request to self
		if (fromUserId === toUserId) {
			throw new CannotSendToSelfError();
		}

		// Check if target user exists
		await this.userService.findById(toUserId);

		// Check if they are already friends
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

		// Check if friend request already exists (pending or accepted)
		const existingRequest = await this.repo.findOne({
			where: [
				{
					fromUserId,
					toUserId,
					status: FriendRequestStatus.PENDING,
				},
				{
					fromUserId: toUserId,
					toUserId: fromUserId,
					status: FriendRequestStatus.PENDING,
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
			status: FriendRequestStatus.PENDING,
			updatedAt: new Date(),
			createdBy: userId,
		});

		await this.repo.insert(friendRequest);

		// Return with relations
		return await this.repo.findOne({
			where: { id: friendRequest.id },
			relations: ["fromUser", "toUser"],
		});
	}

	async updateOne(id: string, dto: UpdateFriendRequestRequest) {
		const existingFriendRequest = await this.findOne(id);
		const userId = this.cls.get("profile").id;

		// Only allow the recipient to update the status
		// if (existingFriendRequest.toUserId !== userId) {
		// 	throw new FriendRequestNotFoundError();
		// }

		// If accepting the request, create friendship
		if (dto.status === FriendRequestStatus.ACCEPTED) {
			await this.createFriendship(
				existingFriendRequest.fromUserId,
				existingFriendRequest.toUserId,
			);
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

	private async createFriendship(userId1: string, userId2: string) {
		// Create bidirectional friendship records
		const friendship1 = this.userFriendRepo.create({
			userId: userId1,
			friendId: userId2,
		});

		await this.userFriendRepo.insert(friendship1);
	}

	async findMany(query: FriendRequestQuery) {
		const userId = this.cls.get("profile").id;
		const { page, limit, status, fromUserId, toUserId, search, type } = query;

		// Build where conditions based on type
		let where: FindOptionsWhere<FriendRequestEntity>[] = [];

		if (type === "sent") {
			where = [{ fromUserId: userId }];
		} else if (type === "received") {
			where = [{ toUserId: userId }];
		} else {
			// type === "all"
			where = [{ fromUserId: userId }, { toUserId: userId }];
		}

		// Apply additional filters
		if (status !== undefined) {
			where = where.map((condition) => ({ ...condition, status }));
		}

		if (fromUserId) {
			where = where.map((condition) => ({ ...condition, fromUserId }));
		}

		if (toUserId) {
			where = where.map((condition) => ({ ...condition, toUserId }));
		}

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
					fromUser: { displayName: ILike(`%${search}%`) },
				},
				{
					...condition,
					toUser: { username: ILike(`%${search}%`) },
				},
				{
					...condition,
					toUser: { displayName: ILike(`%${search}%`) },
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

		// Only allow deletion of pending requests
		if (existingFriendRequest.status !== FriendRequestStatus.PENDING) {
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

		// Only allow canceling pending requests
		if (existingFriendRequest.status !== FriendRequestStatus.PENDING) {
			throw new FriendRequestNotFoundError();
		}

		this.logger.log(
			`Canceling friend request ${id} from user ${userId} to ${existingFriendRequest.toUserId}`,
		);

		await this.repo.update(id, {
			status: FriendRequestStatus.UNFRIEND,
			updatedAt: new Date(),
		});

		this.logger.log(`Friend request ${id} cancelled successfully`);

		return await this.repo.findOne({
			where: { id },
			relations: ["fromUser", "toUser"],
		});
	}
	async getPendingRequestsCount() {
		const userId = this.cls.get("profile").id;

		return await this.repo.count({
			where: {
				toUserId: userId,
				status: FriendRequestStatus.PENDING,
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

		// Only allow accepting pending requests
		if (existingFriendRequest.status !== FriendRequestStatus.PENDING) {
			throw new FriendRequestNotFoundError();
		}

		this.logger.log(
			`Accepting friend request ${id} between users ${existingFriendRequest.fromUserId} and ${userId}`,
		);

		try {
			// Create bidirectional friendship
			await this.createFriendship(userId, existingFriendRequest.fromUserId);

			// Update friend request status to accepted
			const updatedRequest = await this.updateOne(id, {
				status: FriendRequestStatus.ACCEPTED,
			});

			this.logger.log(`Friend request ${id} accepted and friendship created`);
			return updatedRequest;
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

		// Only allow declining pending requests
		if (existingFriendRequest.status !== FriendRequestStatus.PENDING) {
			throw new FriendRequestNotFoundError();
		}

		this.logger.log(
			`Declining friend request ${id} between users ${existingFriendRequest.fromUserId} and ${userId}`,
		);

		// Clean up any existing friendship (edge case)
		await this.removeFriendship(existingFriendRequest.fromUserId, userId);

		// Update friend request status to declined
		const updatedRequest = await this.updateOne(id, {
			status: FriendRequestStatus.DECLINED,
		});

		this.logger.log(`Friend request ${id} declined`);
		return updatedRequest;
	}

	private async removeFriendship(fromUserId: string, toUserId: string) {
		try {
			// Remove bidirectional friendship records if they exist
			await this.userFriendRepo.delete([
				{ userId: fromUserId, friendId: toUserId },
				{ userId: toUserId, friendId: fromUserId },
			]);

			this.logger.log(
				`Removed any existing friendship between ${fromUserId} and ${toUserId}`,
			);
		} catch (error) {
			this.logger.warn(
				`No friendship to remove between ${fromUserId} and ${toUserId}: ${error.message}`,
			);
		}
	}
}
