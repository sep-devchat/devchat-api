import {
	UserFriendRepository,
	UserRepository,
	TaskRepository,
	FriendRequestRepository,
	GroupInvitationRepository,
	UserLanguageCollectionRepository,
	SupportedProgrammingLanguageRepository,
} from "@db/repositories";
import {
	ForbiddenException,
	Injectable,
	Logger,
	OnModuleInit,
	BadRequestException,
} from "@nestjs/common";
import { UserExistedError } from "./errors/user-existed.error";
import * as bcrypt from "bcryptjs";
import {
	UpdateUserRequest,
	UserQuery,
	CreateUserRequest,
	UserLanguageUpdateItem,
	UserAnalyticsOverviewQuery,
	UserAnalyticsOverviewResponse,
	UserAnalyticsTrendQuery,
	UserAnalyticsTrendResponse,
	UserLoginStatsQuery,
	UserLoginStatsResponse,
} from "./dto";
import { DevChatCls, Env, PaginationDto, sendVerificationEmail } from "@utils";
import { UserNotFoundError } from "./errors";
import { randomBytes } from "crypto";
import { ClsService } from "nestjs-cls";
import { Between, FindOptionsWhere, In, Like, MoreThanOrEqual } from "typeorm";
import { FriendRequestEntity } from "@db/entities/friend-request.entity";
import {
	GroupInvitationEntity,
	UserFriendEntity,
	UserEntity,
} from "@db/entities";
import { UserFriendQuery } from "@modules/user-friend/dto";
import * as dayjs from "dayjs";

const emailToken = randomBytes(32).toString("hex");
const ANALYTICS_DEFAULT_TZ = "UTC";

type AnalyticsGranularity = "daily" | "monthly";

interface AnalyticsBucket {
	label: string;
	startUtc: Date;
	endUtc: Date;
	startZoned: dayjs.Dayjs;
	endZoned: dayjs.Dayjs;
}

interface DateRange {
	startUtc: Date;
	endUtc: Date;
}

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
		private readonly userLanguageCollectionRepo: UserLanguageCollectionRepository,
		private readonly supportedProgrammingLanguageRepo: SupportedProgrammingLanguageRepository,
	) {}

	async onModuleInit() {
		await this.initAdmin();
	}

	private async initAdmin() {
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
		const user = await this.userRepo.findOne({
			where: { id },
			relations: {
				userLanguages: {
					language: true,
				},
			},
		});
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

	async markUserLoggedIn(userId: string, timestamp = new Date()) {
		await this.userRepo.update(userId, { lastLogin: timestamp });
	}

	async findByUniqueKey(uniqueKey: string, throwIfNotFound = true) {
		const user = await this.userRepo.findOne({
			where: [{ id: uniqueKey }, { email: uniqueKey }, { username: uniqueKey }],
			relations: {
				userLanguages: {
					language: true,
				},
			},
		});
		if (!user && throwIfNotFound) {
			throw new UserNotFoundError();
		}
		return user;
	}

	async findByEmailToken(token: string) {
		const user = await this.userRepo.findOne({
			where: { emailVerificationToken: token },
			relations: {
				userLanguages: {
					language: true,
				},
			},
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
			relations: {
				userLanguages: {
					language: true,
				},
			},
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
			relations: {
				userLanguages: {
					language: true,
				},
			},
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

		const user = await this.userRepo.findOne({
			where: { id },
			relations: {
				userLanguages: {
					language: true,
				},
			},
		});
		if (!user) throw new UserNotFoundError();

		const { userLanguages, ...userFields } = updateData;
		const sanitizedUserFields = Object.fromEntries(
			Object.entries(userFields).filter(([, value]) => value !== undefined),
		);
		Object.assign(user, sanitizedUserFields);

		if (userLanguages !== undefined) {
			await this.applyUserLanguageUpdates(user, userLanguages, currentUser.id);
		}

		await this.userRepo.save(user);
	}

	private async applyUserLanguageUpdates(
		user: UserEntity,
		payload: UserLanguageUpdateItem[],
		actorUserId: string,
	) {
		if (!payload.length) {
			if ((user.userLanguages?.length ?? 0) > 0) {
				await this.userLanguageCollectionRepo.delete({ userId: user.id });
			}
			user.userLanguages = [];
			return;
		}

		const sorted = payload
			.map((item, idx) => ({
				languageId: item.languageId,
				proficiencyLevel: item.proficiencyLevel,
				requestedOrder: item.orderIndex ?? idx + 1,
			}))
			.sort((a, b) => a.requestedOrder - b.requestedOrder);

		const normalized = sorted.map((item, idx) => ({
			languageId: item.languageId,
			proficiencyLevel: item.proficiencyLevel,
			orderIndex: idx + 1,
		}));

		const seenLanguageIds = new Set<string>();
		for (const item of normalized) {
			if (seenLanguageIds.has(item.languageId)) {
				throw new BadRequestException(
					"Duplicate languageId entries found in userLanguages",
				);
			}
			seenLanguageIds.add(item.languageId);
		}

		await this.validateSupportedLanguages([...seenLanguageIds]);

		const existing = user.userLanguages ?? [];
		const existingMap = new Map(
			existing.map((entry) => [entry.languageId, entry]),
		);

		const updatedLanguages = normalized.map((item) => {
			const current = existingMap.get(item.languageId);
			if (current) {
				current.proficiencyLevel = item.proficiencyLevel;
				current.orderIndex = item.orderIndex;
				current.updatedBy = actorUserId;
				existingMap.delete(item.languageId);
				return current;
			}
			return this.userLanguageCollectionRepo.create({
				userId: user.id,
				languageId: item.languageId,
				proficiencyLevel: item.proficiencyLevel,
				orderIndex: item.orderIndex,
				createdBy: actorUserId,
				updatedBy: actorUserId,
			});
		});

		const toRemove = Array.from(existingMap.values());
		if (toRemove.length) {
			await this.userLanguageCollectionRepo.remove(toRemove);
		}

		user.userLanguages = updatedLanguages;
	}

	private async validateSupportedLanguages(languageIds: string[]) {
		if (!languageIds.length) return;
		const uniqueIds = Array.from(new Set(languageIds));
		const found = await this.supportedProgrammingLanguageRepo.findBy({
			id: In(uniqueIds),
			isActive: true,
		});
		if (found.length !== uniqueIds.length) {
			throw new BadRequestException("Invalid or inactive languageId supplied");
		}
	}

	async getUserOverviewStats(
		query: UserAnalyticsOverviewQuery,
	): Promise<UserAnalyticsOverviewResponse> {
		const timezone = this.resolveTimezone(query.timezone);
		const now = dayjs().tz(timezone);
		const todayRange = this.buildUtcRange(now.startOf("day"), now.endOf("day"));
		const monthRange = this.buildUtcRange(
			now.startOf("month"),
			now.endOf("month"),
		);
		const activeSinceUtc = now
			.subtract(30, "day")
			.startOf("day")
			.utc()
			.toDate();

		const [totalUsers, dailyRegistrations, monthlyRegistrations, activeUsers] =
			await Promise.all([
				this.userRepo.count({ where: { isBot: false } }),
				this.userRepo.count({
					where: {
						isBot: false,
						createdAt: Between(todayRange.startUtc, todayRange.endUtc),
					},
				}),
				this.userRepo.count({
					where: {
						isBot: false,
						createdAt: Between(monthRange.startUtc, monthRange.endUtc),
					},
				}),
				this.userRepo.count({
					where: {
						isBot: false,
						lastLogin: MoreThanOrEqual(activeSinceUtc),
					},
				}),
			]);

		return {
			totalUsers,
			dailyRegistrations,
			monthlyRegistrations,
			activeUsers,
		};
	}

	async getUserTrendStats(
		query: UserAnalyticsTrendQuery,
	): Promise<UserAnalyticsTrendResponse[]> {
		const timezone = this.resolveTimezone(query.timezone);
		const startBoundary = this.parseBoundary(
			query.start,
			query.granularity,
			timezone,
			"start",
		);
		const endBoundary = this.parseBoundary(
			query.end,
			query.granularity,
			timezone,
			"end",
		);

		if (!startBoundary || !endBoundary) {
			throw new BadRequestException("Invalid date range provided");
		}

		const [normalizedStart, normalizedEnd] = startBoundary.isAfter(endBoundary)
			? [endBoundary, startBoundary]
			: [startBoundary, endBoundary];

		const buckets = this.buildBuckets(
			query.granularity,
			normalizedStart,
			normalizedEnd,
		);
		const results: UserAnalyticsTrendResponse[] = [];

		for (const bucket of buckets) {
			const [registrations, logins] = await Promise.all([
				this.userRepo.count({
					where: {
						isBot: false,
						createdAt: Between(bucket.startUtc, bucket.endUtc),
					},
				}),
				this.userRepo.count({
					where: {
						isBot: false,
						lastLogin: Between(bucket.startUtc, bucket.endUtc),
					},
				}),
			]);
			const activeWindowStartUtc = bucket.endZoned
				.clone()
				.subtract(30, "day")
				.startOf("day")
				.utc()
				.toDate();
			const activeUsers = await this.userRepo.count({
				where: {
					isBot: false,
					lastLogin: Between(activeWindowStartUtc, bucket.endUtc),
				},
			});

			results.push({
				label: bucket.label,
				start: bucket.startZoned.toISOString(),
				end: bucket.endZoned.toISOString(),
				registrations,
				activeUsers,
				logins,
			});
		}

		return results;
	}

	async getUserLoginStats(
		query: UserLoginStatsQuery,
	): Promise<UserLoginStatsResponse[]> {
		const timezone = this.resolveTimezone(query.timezone);
		const now = dayjs().tz(timezone);
		const todayRange = this.buildUtcRange(now.startOf("day"), now.endOf("day"));
		const yesterday = now.subtract(1, "day");
		const yesterdayRange = this.buildUtcRange(
			yesterday.startOf("day"),
			yesterday.endOf("day"),
		);
		const sevenDayRange = this.buildUtcRange(
			now.clone().subtract(6, "day").startOf("day"),
			now.endOf("day"),
		);

		const [todayLogins, yesterdayLogins, rollingLogins] = await Promise.all([
			this.countLogins(todayRange),
			this.countLogins(yesterdayRange),
			this.countLogins(sevenDayRange),
		]);
		const [todayPeak, yesterdayPeak] = await Promise.all([
			this.resolvePeakHourLabel(todayRange, timezone),
			this.resolvePeakHourLabel(yesterdayRange, timezone),
		]);

		return [
			{
				periodLabel: "Today",
				successfulLogins: todayLogins,
				peakHour: todayPeak,
			},
			{
				periodLabel: "Yesterday",
				successfulLogins: yesterdayLogins,
				peakHour: yesterdayPeak,
			},
			{
				periodLabel: "7-day Avg",
				successfulLogins: Math.round(rollingLogins / 7),
				peakHour: null,
			},
		];
	}

	async delete(id: string, banReason: string) {
		const currentUser = this.cls.get("profile");
		if (id != currentUser.id && !currentUser.isAdmin)
			throw new ForbiddenException();
		const normalizedReason = banReason?.trim();
		if (!normalizedReason) {
			throw new BadRequestException("Ban reason is required");
		}
		await this.userRepo.update(id, {
			isActive: false,
			banReason: normalizedReason,
		});
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
			relations: {
				fromUser: {
					userLanguages: {
						language: true,
					},
				},
				toUser: {
					userLanguages: {
						language: true,
					},
				},
			},
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
			relations: {
				fromUser: {
					userLanguages: {
						language: true,
					},
				},
				toUser: {
					userLanguages: {
						language: true,
					},
				},
			},
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

			const friendRelations = {
				user: {
					userLanguages: {
						language: true,
					},
				},
				friend: {
					userLanguages: {
						language: true,
					},
				},
			};

			const findOptions = {
				where,
				relations: friendRelations,
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
			relations: {
				fromUser: {
					userLanguages: {
						language: true,
					},
				},
				toUser: {
					userLanguages: {
						language: true,
					},
				},
				group: true,
			},
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
			relations: {
				fromUser: {
					userLanguages: {
						language: true,
					},
				},
				toUser: {
					userLanguages: {
						language: true,
					},
				},
				group: true,
			},
			order: { createdAt: "DESC" },
		});
	}

	async getTasksByGroupId(groupId: string) {
		const userId = this.cls.get("profile").id;

		const tasks = await this.taskRepo.find({
			where: {
				assigneeId: userId,
				groupId: groupId,
			},
			relations: {
				assignee: {
					userLanguages: {
						language: true,
					},
				},
				creator: {
					userLanguages: {
						language: true,
					},
				},
				group: true,
			},
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

		if (!mutualFriendIds.length) {
			return { mutualFriends: [], count: 0 };
		}

		const mutualFriends = await this.userRepo.find({
			where: { id: In(mutualFriendIds) },
			relations: {
				userLanguages: {
					language: true,
				},
			},
		});

		const mutualFriendMap = new Map(
			mutualFriends.map((friend) => [friend.id, friend]),
		);
		const orderedMutualFriends = mutualFriendIds
			.map((id) => mutualFriendMap.get(id))
			.filter((friend): friend is UserEntity => Boolean(friend));

		return {
			mutualFriends: orderedMutualFriends,
			count: orderedMutualFriends.length,
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

	private resolveTimezone(timezone?: string) {
		if (timezone && this.isValidTimezoneName(timezone)) {
			return timezone;
		}
		return ANALYTICS_DEFAULT_TZ;
	}

	private isValidTimezoneName(tz?: string) {
		if (!tz) return false;
		try {
			new Intl.DateTimeFormat("en-US", { timeZone: tz });
			return true;
		} catch {
			return false;
		}
	}

	private parseBoundary(
		value: string,
		granularity: AnalyticsGranularity,
		timezone: string,
		boundary: "start" | "end",
	): dayjs.Dayjs | null {
		if (!value) return null;
		const normalizedValue =
			granularity === "monthly" && value.length === 7 ? `${value}-01` : value;
		const parsed = dayjs.tz(normalizedValue, timezone);
		if (!parsed.isValid()) {
			return null;
		}
		const unit: dayjs.OpUnitType = granularity === "daily" ? "day" : "month";
		return boundary === "start" ? parsed.startOf(unit) : parsed.endOf(unit);
	}

	private buildBuckets(
		granularity: AnalyticsGranularity,
		start: dayjs.Dayjs,
		end: dayjs.Dayjs,
	): AnalyticsBucket[] {
		const unit: dayjs.OpUnitType = granularity === "daily" ? "day" : "month";
		const bucketCount =
			granularity === "daily"
				? end.startOf("day").diff(start.startOf("day"), "day") + 1
				: end.startOf("month").diff(start.startOf("month"), "month") + 1;
		const maxBuckets = granularity === "daily" ? 180 : 48;
		if (bucketCount > maxBuckets) {
			throw new BadRequestException(
				`Requested range is too large (${bucketCount} buckets). Please choose a smaller window.`,
			);
		}
		const labelFormat =
			granularity === "daily"
				? bucketCount > 10
					? "MMM D"
					: "ddd"
				: bucketCount > 6
					? "MMM YYYY"
					: "MMM";

		const buckets: AnalyticsBucket[] = [];
		let cursor = start.clone();
		while (cursor.isBefore(end) || cursor.isSame(end, unit)) {
			const bucketStart = cursor.clone();
			const bucketEnd = bucketStart.clone().endOf(unit);
			buckets.push({
				label: bucketStart.format(labelFormat),
				startUtc: bucketStart.utc().toDate(),
				endUtc: bucketEnd.utc().toDate(),
				startZoned: bucketStart,
				endZoned: bucketEnd,
			});
			cursor = cursor.add(1, unit);
		}
		return buckets;
	}

	private buildUtcRange(start: dayjs.Dayjs, end: dayjs.Dayjs): DateRange {
		return {
			startUtc: start.utc().toDate(),
			endUtc: end.utc().toDate(),
		};
	}

	private countLogins(range: DateRange) {
		return this.userRepo.count({
			where: {
				isBot: false,
				lastLogin: Between(range.startUtc, range.endUtc),
			},
		});
	}

	private async resolvePeakHourLabel(range: DateRange, timezone: string) {
		const entries = await this.userRepo.find({
			where: {
				isBot: false,
				lastLogin: Between(range.startUtc, range.endUtc),
			},
			select: { id: true, lastLogin: true },
		});
		if (!entries.length) {
			return null;
		}
		const bucketCounts = new Map<string, number>();
		for (const entry of entries) {
			if (!entry.lastLogin) continue;
			const zoned = dayjs(entry.lastLogin).tz(timezone);
			const hourStart = zoned.startOf("hour");
			const label = `${hourStart.format("HH:mm")} - ${hourStart
				.add(1, "hour")
				.format("HH:mm")}`;
			bucketCounts.set(label, (bucketCounts.get(label) ?? 0) + 1);
		}
		if (!bucketCounts.size) {
			return null;
		}
		return [...bucketCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
	}
}
