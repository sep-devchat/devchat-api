import {
	UserFriendRepository,
	UserRepository,
	TaskRepository,
	FriendRequestRepository,
	GroupInvitationRepository,
} from "@db/repositories";
import {
	ForbiddenException,
	Injectable,
	Logger,
	OnModuleInit,
} from "@nestjs/common";
import { UserExistedError } from "./errors/user-existed.error";
import * as bcrypt from "bcryptjs";
import { UpdateUserRequest, UserQuery, CreateUserRequest } from "./dto";
import {
	DevChatCls,
	Env,
	PaginationDto,
	sendVerificationEmail,
	TaskStatusEnum,
} from "@utils";
import { UserNotFoundError } from "./errors";
import { randomBytes } from "crypto";
import { ClsService } from "nestjs-cls";
import { In, FindOptionsWhere, Like } from "typeorm";
import { FriendRequestEntity } from "@db/entities/friend-request.entity";
import { GroupInvitationEntity, UserFriendEntity } from "@db/entities";
import { UserFriendQuery } from "@modules/user-friend/dto";

const emailToken = randomBytes(32).toString("hex");

@Injectable()
export class UserService implements OnModuleInit {
	private readonly logger = new Logger(UserService.name);

	constructor(
		private readonly userRepo: UserRepository,
		private readonly taskRepo: TaskRepository,
		private readonly cls: ClsService<DevChatCls>,
		private readonly userFriendRepo: UserFriendRepository,
		private readonly friendRequestRepo: FriendRequestRepository,
		private readonly groupInvitationRepo: GroupInvitationRepository,
	) {}

	async onModuleInit() {
		const admin = await this.userRepo.findOne({
			where: { email: Env.EMAIL_USER },
		});
		if (!admin) {
			await this.userRepo.insert({
				email: Env.EMAIL_USER,
				username: Env.EMAIL_USER.split("@")[0],
				password: bcrypt.hashSync(Math.random().toString(36).slice(-8), 10),
				firstName: "Admin",
				lastName: "Admin",
				isActive: true,
				emailVerified: true,
				isAdmin: true,
			});
			console.log("Admin user created");
		}
	}

	async validateBeforeCreate(dto: CreateUserRequest) {
		const user = await this.userRepo.findOne({
			where: [
				{
					username: dto.username,
				},
				{
					email: dto.email,
				},
			],
		});

		if (user && user.isActive) {
			throw new UserExistedError();
		}
	}

	async create(dto: CreateUserRequest, emailVerified = false) {
		const existingUser = await this.userRepo.findOne({
			where: [
				{
					username: dto.username,
				},
				{
					email: dto.email,
				},
			],
		});

		if (existingUser && existingUser.isActive) {
			throw new UserExistedError();
		}

		const hashedPass = bcrypt.hashSync(dto.password, 10);

		if (existingUser && !existingUser.isActive) {
			existingUser.username = dto.username;
			existingUser.email = dto.email;
			existingUser.password = hashedPass;
			existingUser.firstName = dto.firstName ?? null;
			existingUser.lastName = dto.lastName ?? null;
			existingUser.avatarUrl = dto.avatarUrl ?? null;
			existingUser.timezone = dto.timezone ?? null;
			existingUser.isActive = true;
			existingUser.emailVerified = emailVerified;
			existingUser.emailVerificationToken = emailToken;
			existingUser.emailVerifiedAt = emailVerified ? new Date() : null;

			await this.userRepo.save(existingUser);
			await sendVerificationEmail(existingUser.email, emailToken);
			return { identifiers: [{ id: existingUser.id }] };
		}

		const user = this.userRepo.create({
			username: dto.username,
			email: dto.email,
			password: hashedPass,
			firstName: dto.firstName ?? null,
			lastName: dto.lastName ?? null,
			avatarUrl: dto.avatarUrl ?? null,
			timezone: dto.timezone ?? null,
			emailVerified,
			emailVerificationToken: emailToken,
		});

		await sendVerificationEmail(user.email, emailToken);

		return await this.userRepo.insert(user);
	}

	async findById(id: string) {
		const user = await this.userRepo.findOne({ where: { id } });
		if (!user) {
			throw new UserNotFoundError();
		}
		return user;
	}

	async setActive(id: string, isActive: boolean) {
		const currentProfile = this.cls.get("profile");
		const target = await this.userRepo.findOne({ where: { id } });
		if (!target) throw new UserNotFoundError();
		// Only admin can change other users' active status; user can change own (optional)
		if (currentProfile?.id !== id && !currentProfile?.isAdmin) {
			throw new ForbiddenException(
				"Not allowed to modify other user active state",
			);
		}
		// Prevent admin self-deactivation edge case (optional safeguard)
		if (target.isAdmin && !isActive && currentProfile?.id === target.id) {
			throw new ForbiddenException("Admin cannot deactivate own account");
		}
		target.isActive = isActive;
		await this.userRepo.save(target);
		return target;
	}

	async findByUniqueKey(uniqueKey: string, throwIfNotFound = true) {
		const user = await this.userRepo.findOne({
			where: [{ id: uniqueKey }, { email: uniqueKey }, { username: uniqueKey }],
		});
		if (!user && throwIfNotFound) {
			throw new UserNotFoundError();
		}
		return user;
	}

	async findByEmailToken(token: string) {
		const user = await this.userRepo.findOne({
			where: { emailVerificationToken: token },
		});

		if (!user) {
			throw new UserNotFoundError();
		}
		return user;
	}

	async markEmailAsVerified(id: string) {
		const user = await this.findById(id);
		if (!user) {
			throw new UserNotFoundError();
		}
		await this.userRepo.update(id, {
			emailVerified: true,
			isActive: true,
			emailVerifiedAt: new Date(),
		});
	}

	async getAll(query: UserQuery) {
		const { page, limit } = query;
		const [data, total] = await this.userRepo.findAndCount({
			where: { isBot: false },
			skip: (page - 1) * limit,
			take: limit,
			order: { createdAt: "DESC" },
		});

		const pagination = new PaginationDto(page, limit, total);

		return {
			data,
			pagination,
		};
	}

	async search(query: UserQuery) {
		const { page, limit, search } = query;

		const base = { isBot: false };
		const where = search
			? [
					{ ...base, username: Like(`%${search}%`) },
					{ ...base, email: Like(`%${search}%`) },
					{ ...base, firstName: Like(`%${search}%`) },
					{ ...base, lastName: Like(`%${search}%`) },
				]
			: base;

		const [data, total] = await this.userRepo.findAndCount({
			where,
			skip: (page - 1) * limit,
			take: limit,
			order: { createdAt: "DESC" },
		});

		const pagination = new PaginationDto(page, limit, total);

		return {
			data,
			pagination,
		};
	}

	async update(id: string, updateData: UpdateUserRequest) {
		const currentUser = this.cls.get("profile");
		if (id != currentUser.id && !currentUser.isAdmin)
			throw new ForbiddenException();
		await this.userRepo.update(id, updateData);
	}

	async delete(id: string) {
		const currentUser = this.cls.get("profile");
		if (id != currentUser.id && !currentUser.isAdmin)
			throw new ForbiddenException();
		await this.userRepo.update(id, { isActive: false });
	}

	async getSentFriendRequests(search?: string) {
		const userId = this.cls.get("profile").id;

		let where:
			| FindOptionsWhere<FriendRequestEntity>[]
			| FindOptionsWhere<FriendRequestEntity>;

		if (search) {
			const searchPattern = `%${search}%`;
			where = [
				{
					fromUserId: userId,
					toUser: { firstName: Like(searchPattern) },
				},
				{
					fromUserId: userId,
					toUser: { lastName: Like(searchPattern) },
				},
				{
					fromUserId: userId,
					toUser: { username: Like(searchPattern) },
				},
			];
		} else {
			where = { fromUserId: userId };
		}

		return this.friendRequestRepo.find({
			where,
			relations: ["fromUser", "toUser"],
			order: { createdAt: "DESC" },
		});
	}

	async getReceivedFriendRequests(search?: string) {
		const userId = this.cls.get("profile").id;

		let where:
			| FindOptionsWhere<FriendRequestEntity>[]
			| FindOptionsWhere<FriendRequestEntity>;

		if (search) {
			const searchPattern = `%${search}%`;
			where = [
				{
					toUserId: userId,
					fromUser: { firstName: Like(searchPattern) },
				},
				{
					toUserId: userId,
					fromUser: { lastName: Like(searchPattern) },
				},
				{
					toUserId: userId,
					fromUser: { username: Like(searchPattern) },
				},
			];
		} else {
			where = { toUserId: userId };
		}

		return this.friendRequestRepo.find({
			where,
			relations: ["fromUser", "toUser"],
			order: { createdAt: "DESC" },
		});
	}

	async getAllFriendsWithMutuals(query: UserFriendQuery) {
		try {
			this.logger.log(
				`Starting getAllFriendsWithMutuals with query: ${JSON.stringify(query)}`,
			);

			const profile = this.cls.get("profile");
			this.logger.log(`CLS profile: ${JSON.stringify(profile)}`);

			if (!profile || !profile.id) {
				this.logger.error("No user profile found in CLS context");
				throw new Error("User not found in context");
			}

			const userId = profile.id;
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
						friend: { username: Like(`%${search}%`) },
					},
					{
						userId,
						friend: { firstName: Like(`%${search}%`) },
					},
					{
						userId,
						friend: { lastName: Like(`%${search}%`) },
					},
					{
						friendId: userId,
						user: { username: Like(`%${search}%`) },
					},
					{
						friendId: userId,
						user: { firstName: Like(`%${search}%`) },
					},
					{
						friendId: userId,
						user: { lastName: Like(`%${search}%`) },
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

				// Extract the friend users and add mutual friends
				const friendsWithMutuals = await Promise.all(
					data.map(async (friendship) => {
						const friend =
							friendship.userId === userId
								? friendship.friend
								: friendship.user;

						this.logger.log(
							`Processing friendship: ${JSON.stringify({
								friendshipId: friendship.id,
								userId: friendship.userId,
								friendId: friendship.friendId,
								friendName: friend.username,
								friendFullName: `${friend.firstName} ${friend.lastName}`,
							})}`,
						);

						try {
							const mutuals = await this.getMutualFriends(friend.id);
							return {
								...friend,
								mutualFriends: mutuals.mutualFriends,
								mutualFriendsCount: mutuals.count,
							};
						} catch (error) {
							// If mutual friends calculation fails, return friend without mutuals
							this.logger.warn(
								`Failed to get mutual friends for user ${friend.id}:`,
								error.message,
							);
							return {
								...friend,
								mutualFriends: [],
								mutualFriendsCount: 0,
							};
						}
					}),
				);

				return { friends: friendsWithMutuals, pagination };
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

			// Extract the friend users and add mutual friends
			const friendsWithMutuals = await Promise.all(
				data.map(async (friendship) => {
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

					try {
						const mutuals = await this.getMutualFriends(friend.id);
						return {
							...friend,
							mutualFriends: mutuals.mutualFriends,
							mutualFriendsCount: mutuals.count,
						};
					} catch (error) {
						// If mutual friends calculation fails, return friend without mutuals
						this.logger.warn(
							`Failed to get mutual friends for user ${friend.id}:`,
							error.message,
						);
						return {
							...friend,
							mutualFriends: [],
							mutualFriendsCount: 0,
						};
					}
				}),
			);

			return { friends: friendsWithMutuals, pagination };
		} catch (error) {
			this.logger.error(`Error in getAllFriendsWithMutuals: ${error.message}`);
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

	async getPendingFriendRequestsCount() {
		const userId = this.cls.get("profile").id;

		return await this.friendRequestRepo.count({
			where: {
				toUserId: userId,
			},
		});
	}

	async getReceivedGroupInvitations(search?: string) {
		const userId = this.cls.get("profile").id;

		let where:
			| FindOptionsWhere<GroupInvitationEntity>[]
			| FindOptionsWhere<GroupInvitationEntity>;

		if (search) {
			const searchPattern = `%${search}%`;
			where = {
				toUserId: userId,
				group: { name: Like(searchPattern) },
			};
		} else {
			where = { toUserId: userId };
		}

		return this.groupInvitationRepo.find({
			where,
			relations: ["fromUser", "toUser", "group"],
			order: { createdAt: "DESC" },
		});
	}

	async getSentGroupInvitations(search?: string) {
		const userId = this.cls.get("profile").id;

		let where:
			| FindOptionsWhere<GroupInvitationEntity>[]
			| FindOptionsWhere<GroupInvitationEntity>;

		if (search) {
			const searchPattern = `%${search}%`;
			where = {
				fromUserId: userId,
				group: { name: Like(searchPattern) },
			};
		} else {
			where = { fromUserId: userId };
		}

		return this.groupInvitationRepo.find({
			where,
			relations: ["fromUser", "toUser", "group"],
			order: { createdAt: "DESC" },
		});
	}

	async getTasksByGroupId(groupId: string) {
		const userId = this.cls.get("profile").id;

		const tasks = await this.taskRepo.find({
			where: {
				assigneeId: userId,
				groupId: groupId,
				status: In([TaskStatusEnum.IN_PROGRESS, TaskStatusEnum.TODO]),
			},
			relations: ["assignee", "creator", "group"],
		});

		return tasks;
	}

	async getMutualFriends(targetUserId: string) {
		const profile = this.cls.get("profile");
		if (!profile || !profile.id) {
			throw new UserNotFoundError();
		}
		const userId = profile.id;

		// Verify target user exists - use repository to avoid throwing error
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

	async getMutualFriendsCount(targetUserId: string) {
		const profile = this.cls.get("profile");
		if (!profile || !profile.id) {
			throw new UserNotFoundError();
		}
		const userId = profile.id;

		const targetUser = await this.userRepo.findOne({
			where: { id: targetUserId },
		});
		if (!targetUser) {
			throw new UserNotFoundError();
		}

		const userFriends = await this.userFriendRepo.find({
			where: [{ userId }, { friendId: userId }],
			select: ["userId", "friendId"],
		});

		const targetFriends = await this.userFriendRepo.find({
			where: [{ userId: targetUserId }, { friendId: targetUserId }],
			select: ["userId", "friendId"],
		});

		const userFriendIds = new Set(
			userFriends.map((friendship) =>
				friendship.userId === userId ? friendship.friendId : friendship.userId,
			),
		);

		const targetFriendIds = new Set(
			targetFriends.map((friendship) =>
				friendship.userId === targetUserId
					? friendship.friendId
					: friendship.userId,
			),
		);

		const mutualFriendIds = [...userFriendIds].filter((id) =>
			targetFriendIds.has(id),
		);

		return {
			count: mutualFriendIds.length,
		};
	}
}
