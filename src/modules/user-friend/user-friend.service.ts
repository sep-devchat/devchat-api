import { Injectable, Logger } from "@nestjs/common";
import { UserFriendQuery } from "./dto";
import {
	UserFriendRepository,
	FriendRequestRepository,
	UserRepository,
} from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls, PaginationDto } from "@utils";
import { FindOptionsWhere, ILike } from "typeorm";
import { UserFriendEntity } from "@db/entities";
import { FriendshipNotFoundError, UserNotFoundError } from "./errors";

@Injectable()
export class UserFriendService {
	private readonly logger = new Logger(UserFriendService.name);

	constructor(
		private readonly userFriendRepo: UserFriendRepository,
		private readonly friendRequestRepo: FriendRequestRepository,
		private readonly userRepo: UserRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	async unfriend(friendId: string) {
		const userId = this.cls.get("profile").id;

		// Verify the friend user exists
		const friendUser = await this.userRepo.findOne({ where: { id: friendId } });
		if (!friendUser) {
			throw new UserNotFoundError();
		}

		// Verify they are actually friends
		const friendship = await this.userFriendRepo.findOne({
			where: [
				{ userId, friendId },
				{ userId: friendId, friendId: userId },
			],
		});

		if (!friendship) {
			throw new FriendshipNotFoundError();
		}

		// Remove the single friendship record we found
		await this.userFriendRepo.remove(friendship);

		return { message: "Successfully unfriended user" };
	}

	async getAllFriends(query: UserFriendQuery) {
		try {
			this.logger.log(
				`Starting getAllFriends with query: ${JSON.stringify(query)}`,
			);

			const profile = this.cls.get("profile");
			this.logger.log(`CLS profile: ${JSON.stringify(profile)}`);

			if (!profile || !profile.id) {
				this.logger.error("No user profile found in CLS context");
				throw new Error("User not found in context");
			}

			const userId = this.cls.get("profile").id;
			this.logger.log(`Extracted userId: ${userId}`);
			const { page, limit, search } = query;

			// Build where conditions
			const where: FindOptionsWhere<UserFriendEntity>[] = [
				{ userId },
				{ friendId: userId },
			];

			const findOptions = {
				where,
				relations: ["user", "friend"],
				skip: (page - 1) * limit,
				take: limit,
				order: { createdAt: "DESC" as const },
			};

			// Handle search if provided
			if (search) {
				const searchConditions = [
					{
						userId,
						friend: { username: ILike(`%${search}%`) },
					},
					{
						userId,
						friend: { firstName: ILike(`%${search}%`) },
					},
					{
						userId,
						friend: { lastName: ILike(`%${search}%`) },
					},
					{
						friendId: userId,
						user: { username: ILike(`%${search}%`) },
					},
					{
						friendId: userId,
						user: { firstName: ILike(`%${search}%`) },
					},
					{
						friendId: userId,
						user: { lastName: ILike(`%${search}%`) },
					},
				];

				this.logger.log(
					`Finding friends with search conditions: ${JSON.stringify(searchConditions)}`,
				);
				this.logger.log(`User ID from CLS: ${userId}`);

				let data, total;
				try {
					[data, total] = await this.userFriendRepo.findAndCount({
						where: searchConditions,
						relations: findOptions.relations,
						skip: findOptions.skip,
						take: findOptions.take,
						order: findOptions.order,
					});
					this.logger.log(
						`Found ${total} total friends, returned ${data.length} items`,
					);
					this.logger.log(
						`Raw data from query: ${JSON.stringify(data, null, 2)}`,
					);
				} catch (dbError) {
					this.logger.error(`Database query failed: ${dbError.message}`);
					this.logger.error(
						`Query was: ${JSON.stringify(searchConditions, null, 2)}`,
					);
					throw dbError;
				}

				const pagination = new PaginationDto(page, limit, total);

				// Extract the friend users from the relationship records
				const friends = data.map((friendship) => {
					const friend =
						friendship.userId === userId ? friendship.friend : friendship.user;

					this.logger.log(
						`Processing friendship: ${JSON.stringify({
							friendshipId: friendship.id,
							userId: friendship.userId,
							friendId: friendship.friendId,
							friendName: friend.username,
							friendFullName: `${friend.firstName} ${friend.lastName}`,
						})}`,
					);

					// Return the friend (not the current user)
					return friend;
				});

				return { friends, pagination };
			}

			// Regular find without search
			this.logger.log(
				`Finding all friends for user ${userId} with options: ${JSON.stringify(findOptions)}`,
			);
			this.logger.log(`User ID from CLS: ${userId}`);

			let data, total;
			try {
				[data, total] = await this.userFriendRepo.findAndCount(findOptions);
				this.logger.log(
					`Found ${total} total friends, returned ${data.length} items`,
				);
				this.logger.log(
					`Raw data from query: ${JSON.stringify(data, null, 2)}`,
				);
			} catch (dbError) {
				this.logger.error(`Database query failed: ${dbError.message}`);
				this.logger.error(`Query was: ${JSON.stringify(findOptions, null, 2)}`);
				throw dbError;
			}

			const pagination = new PaginationDto(page, limit, total);

			// Extract the friend users from the relationship records
			const friends = data.map((friendship) => {
				const friend =
					friendship.userId === userId ? friendship.friend : friendship.user;

				this.logger.log(
					`Processing friendship: ${JSON.stringify({
						friendshipId: friendship.id,
						userId: friendship.userId,
						friendId: friendship.friendId,
						friendName: friend.username,
						friendFullName: `${friend.firstName} ${friend.lastName}`,
					})}`,
				);

				// Return the friend (not the current user)
				return friend;
			});

			return { friends, pagination };
		} catch (error) {
			this.logger.error(`Error in getAllFriends: ${error.message}`);
			this.logger.error(`Stack trace: ${error.stack}`);
			throw error;
		}
	}

	async getFriendshipStatus(friendId: string) {
		const userId = this.cls.get("profile").id;

		// Check if they are friends
		const friendship = await this.userFriendRepo.findOne({
			where: [
				{ userId, friendId },
				{ userId: friendId, friendId: userId },
			],
		});

		if (friendship) {
			return {
				status: "friends",
				since: friendship.createdAt,
			};
		}

		// Check if there's a pending friend request
		const friendRequest = await this.friendRequestRepo.findOne({
			where: [
				{
					fromUserId: userId,
					toUserId: friendId,
				},
				{
					fromUserId: friendId,
					toUserId: userId,
				},
			],
			relations: ["fromUser", "toUser"],
		});

		if (friendRequest) {
			return {
				status: "pending",
				direction: friendRequest.fromUserId === userId ? "sent" : "received",
				requestId: friendRequest.id,
				since: friendRequest.createdAt,
			};
		}

		return { status: "none" };
	}

	async getFriendsCount() {
		const userId = this.cls.get("profile").id;

		return await this.userFriendRepo.count({
			where: [{ userId }, { friendId: userId }],
		});
	}

	async getMutualFriends(targetUserId: string) {
		const userId = this.cls.get("profile").id;

		// Verify target user exists
		const targetUser = await this.userRepo.findOne({
			where: { id: targetUserId },
		});
		if (!targetUser) {
			throw new UserNotFoundError();
		}

		// Get current user's friends
		const userFriends = await this.userFriendRepo.find({
			where: [{ userId }, { friendId: userId }],
			relations: ["user", "friend"],
		});

		// Get target user's friends
		const targetFriends = await this.userFriendRepo.find({
			where: [{ userId: targetUserId }, { friendId: targetUserId }],
			relations: ["user", "friend"],
		});

		// Extract friend IDs for current user
		const userFriendIds = new Set(
			userFriends.map((friendship) =>
				friendship.userId === userId ? friendship.friendId : friendship.userId,
			),
		);

		// Extract friend IDs for target user
		const targetFriendIds = new Set(
			targetFriends.map((friendship) =>
				friendship.userId === targetUserId
					? friendship.friendId
					: friendship.userId,
			),
		);

		// Find mutual friend IDs
		const mutualFriendIds = [...userFriendIds].filter((id) =>
			targetFriendIds.has(id),
		);

		// Get mutual friends data
		const mutualFriends = [];
		for (const friendId of mutualFriendIds) {
			const friend = await this.userRepo.findOne({ where: { id: friendId } });
			if (friend) {
				mutualFriends.push(friend);
			}
		}

		return {
			mutualFriends,
			count: mutualFriends.length,
		};
	}

	async checkIfFriends(friendId: string): Promise<boolean> {
		const userId = this.cls.get("profile").id;

		const friendship = await this.userFriendRepo.findOne({
			where: [
				{ userId, friendId },
				{ userId: friendId, friendId: userId },
			],
		});

		return !!friendship;
	}

	async findFriendsByIds(friendIds: string[]) {
		const userId = this.cls.get("profile").id;

		const friendships = await this.userFriendRepo.find({
			where: friendIds.flatMap((friendId) => [
				{ userId, friendId },
				{ userId: friendId, friendId: userId },
			]),
			relations: ["user", "friend"],
		});

		return friendships.map((friendship) =>
			friendship.userId === userId ? friendship.friend : friendship.user,
		);
	}
}
