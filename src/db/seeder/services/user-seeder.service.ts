import { faker } from "@faker-js/faker";
import {
	FriendRequestRepository,
	SupportedProgrammingLanguageRepository,
	UserFriendRepository,
	UserLanguageCollectionRepository,
	UserRepository,
} from "@db/repositories";
import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";
import {
	FriendRequestEntity,
	SupportedProgrammingLanguageEntity,
	UserEntity,
	UserLanguageCollectionEntity,
	UserFriendEntity,
} from "@db/entities";
import { ProgrammingLanguageProficiencyLevel, Env } from "@utils";
import { FindOptionsWhere, In, Not } from "typeorm";
import {
	applySeedTimestamps,
	randomDateAfter,
	randomDateInSeedRange,
} from "../utils/seed-date.util";

interface RequiredUserConfig {
	email: string;
	username: string;
	password?: string;
	firstName?: string;
	lastName?: string;
	isVerified?: boolean;
	isActive?: boolean;
	avatar?: string;
}

@Injectable()
export class UserSeederService {
	private readonly TOTAL_USERS = 50;
	private readonly MAX_CONNECTIONS_PER_USER = 4;
	private readonly DEFAULT_PASSWORD = "Admin@123";
	private readonly importantEmails = this.loadImportantEmails();
	private readonly requiredUsersConfig = this.loadRequiredUsers();

	constructor(
		private readonly userRepo: UserRepository,
		private readonly userFriendRepo: UserFriendRepository,
		private readonly friendRequestRepo: FriendRequestRepository,
		private readonly programmingLanguageRepo: SupportedProgrammingLanguageRepository,
		private readonly userLanguageCollectionRepo: UserLanguageCollectionRepository,
	) {}

	async run() {
		const requiredUsers = await this.seedRequiredUsers();

		const existingUsersCount = await this.userRepo.count({
			where: this.buildUserFilter(),
		});
		const usersToCreate = this.TOTAL_USERS - existingUsersCount;
		let createdUsers: UserEntity[] = [];

		if (usersToCreate > 0) {
			console.log(`Seeding ${usersToCreate} users...`);
			const languages = await this.programmingLanguageRepo.find({
				where: { isActive: true },
				select: ["id", "languageCode"],
			});
			const passwordHash = bcrypt.hashSync(this.DEFAULT_PASSWORD, 10);
			createdUsers = await this.createUsers(
				usersToCreate,
				existingUsersCount,
				passwordHash,
			);
			await this.seedLanguageCollections(createdUsers, languages);
			console.log(
				`User seeding finished. Default password for all generated users: ${this.DEFAULT_PASSWORD}.`,
			);
		} else {
			console.log(
				`No new users created; ${existingUsersCount} users already exist (target ${this.TOTAL_USERS}).`,
			);
		}

		const allUsers = await this.userRepo.find({
			where: this.buildUserFilter(),
		});
		await this.seedConnections(allUsers);
		await this.ensureRequiredUserFriendships(requiredUsers);
	}

	private async createUsers(
		count: number,
		currentTotal: number,
		password: string,
	): Promise<UserEntity[]> {
		const newUsers: UserEntity[] = Array.from({ length: count }).map(
			(_, idx) => {
				const firstName = faker.person.firstName();
				const lastName = faker.person.lastName();
				const sequence = currentTotal + idx + 1;
				const baseEmail = faker.internet
					.email({
						firstName,
						lastName,
						provider: "seed.devchat.local",
						allowSpecialCharacters: false,
					})
					.toLowerCase();
				const [rawLocalPart, rawDomain = "seed.devchat.local"] =
					baseEmail.split("@");
				const safeLocalPart =
					(rawLocalPart || "devuser").replace(/[^a-z0-9._-]/gi, "") ||
					"devuser";
				let localPart = `${safeLocalPart}-${sequence
					.toString()
					.padStart(2, "0")}`;
				const domain =
					rawDomain.replace(/[^a-z0-9.-]/gi, "") || "seed.devchat.local";
				let email = `${localPart}@${domain}`;
				let attempt = 0;
				while (this.isImportantEmail(email) && attempt < 5) {
					localPart = `${safeLocalPart}-${sequence
						.toString()
						.padStart(
							2,
							"0",
						)}-${faker.string.alphanumeric({ length: 4 }).toLowerCase()}`;
					email = `${localPart}@${domain}`;
					attempt += 1;
				}
				const username = localPart;
				const emailVerified = faker.helpers.arrayElement([true, true, false]);
				const emailVerifiedAt = emailVerified ? randomDateInSeedRange() : null;
				const timezone = faker.location.timeZone();
				const lastLogin = emailVerified
					? randomDateAfter(emailVerifiedAt)
					: null;
				return applySeedTimestamps(
					this.userRepo.create({
						username,
						email,
						password,
						firstName,
						lastName,
						avatarUrl: faker.image.avatar(),
						isActive: true,
						banReason: null,
						emailVerified,
						emailVerifiedAt,
						emailVerificationToken: emailVerified ? null : faker.string.uuid(),
						lastLogin,
						timezone: timezone.slice(0, 50),
						isAdmin: false,
						isBot: false,
						subscriptionRole: faker.helpers.maybe(
							() =>
								faker.helpers.arrayElements(
									["free", "pro", "beta"],
									faker.number.int({ min: 1, max: 2 }),
								),
							{ probability: 0.4 },
						) ?? ["free"],
					}),
					{
						minCreatedAt: emailVerifiedAt,
					},
				);
			},
		);

		const savedUsers = await this.userRepo.save(newUsers);
		return savedUsers;
	}

	private async seedLanguageCollections(
		users: UserEntity[],
		languages: Pick<SupportedProgrammingLanguageEntity, "id">[],
	) {
		if (!users.length || !languages.length) {
			if (!languages.length) {
				console.warn(
					"No supported programming languages available; skipping language preferences seeding.",
				);
			}
			return;
		}

		const languageEntries: UserLanguageCollectionEntity[] = [];
		const levels = Object.values(ProgrammingLanguageProficiencyLevel);
		for (const user of users) {
			const maxLanguages = Math.min(4, languages.length);
			const languageCount = faker.number.int({ min: 1, max: maxLanguages });
			const selectedLanguages = faker.helpers
				.shuffle(languages)
				.slice(0, languageCount);
			selectedLanguages.forEach((language, orderIndex) => {
				languageEntries.push(
					applySeedTimestamps(
						this.userLanguageCollectionRepo.create({
							userId: user.id,
							languageId: language.id,
							proficiencyLevel: faker.helpers.arrayElement(levels),
							orderIndex,
							createdBy: user.id,
							updatedBy: user.id,
							isActive: true,
						}),
					),
				);
			});
		}

		if (languageEntries.length) {
			await this.userLanguageCollectionRepo.save(languageEntries);
			console.log(
				`Attached ${languageEntries.length} programming-language records to ${users.length} users.`,
			);
		}
	}

	private async seedConnections(users: UserEntity[]) {
		if (users.length < 2) {
			console.warn("Not enough eligible users to seed friendships.");
			return;
		}

		const friendPairs = new Set<string>();
		const pendingRequests = new Set<string>();
		const friendEntities: UserFriendEntity[] = [];
		const requestEntities: FriendRequestEntity[] = [];
		const friendCounts = new Map<string, number>();

		const existingFriendships = await this.userFriendRepo.find({
			select: ["userId", "friendId"],
		});
		existingFriendships.forEach((item) => {
			friendPairs.add(this.buildPairKey(item.userId, item.friendId));
			friendCounts.set(item.userId, (friendCounts.get(item.userId) ?? 0) + 1);
			friendCounts.set(
				item.friendId,
				(friendCounts.get(item.friendId) ?? 0) + 1,
			);
		});

		const existingRequests = await this.friendRequestRepo.find({
			select: ["fromUserId", "toUserId"],
		});
		existingRequests.forEach((item) => {
			pendingRequests.add(`${item.fromUserId}->${item.toUserId}`);
		});

		for (const user of users) {
			const maxConnections = Math.min(
				this.MAX_CONNECTIONS_PER_USER,
				users.length - 1,
			);
			if (maxConnections <= 0) continue;
			const isImportant = this.isImportantEmail(user.email);
			const minConnections = isImportant ? 1 : 0;
			const candidateCount = faker.number.int({
				min: Math.min(minConnections, maxConnections),
				max: maxConnections,
			});
			if (!candidateCount) continue;

			const candidates = faker.helpers
				.shuffle(users.filter((candidate) => candidate.id !== user.id))
				.slice(0, candidateCount);

			for (const candidate of candidates) {
				const pairKey = this.buildPairKey(user.id, candidate.id);
				if (friendPairs.has(pairKey)) {
					continue;
				}

				if (Math.random() < 0.6) {
					friendPairs.add(pairKey);
					friendEntities.push(
						applySeedTimestamps(
							this.userFriendRepo.create({
								userId: user.id,
								friendId: candidate.id,
							}),
						),
					);
					friendCounts.set(user.id, (friendCounts.get(user.id) ?? 0) + 1);
					friendCounts.set(
						candidate.id,
						(friendCounts.get(candidate.id) ?? 0) + 1,
					);
					continue;
				}

				const requestKey = `${user.id}->${candidate.id}`;
				const inverseKey = `${candidate.id}->${user.id}`;
				if (
					pendingRequests.has(requestKey) ||
					pendingRequests.has(inverseKey)
				) {
					continue;
				}

				pendingRequests.add(requestKey);
				requestEntities.push(
					applySeedTimestamps(
						this.friendRequestRepo.create({
							fromUserId: user.id,
							toUserId: candidate.id,
							message: faker.helpers.maybe(() => faker.lorem.sentence(), {
								probability: 0.4,
							}),
							createdBy: user.id,
						}),
					),
				);
			}
		}

		this.ensureImportantFriendships(
			users,
			friendPairs,
			friendEntities,
			friendCounts,
		);

		if (friendEntities.length) {
			await this.userFriendRepo.save(friendEntities);
		}
		if (requestEntities.length) {
			await this.friendRequestRepo.save(requestEntities);
		}

		console.log(
			`Seeded ${friendEntities.length} friendships and ${requestEntities.length} pending friend requests among ${users.length} users.`,
		);
	}

	private async seedRequiredUsers(): Promise<UserEntity[]> {
		if (!this.requiredUsersConfig.length) {
			return [];
		}

		const ensuredUsers: UserEntity[] = [];
		for (const config of this.requiredUsersConfig) {
			const email = config.email?.trim().toLowerCase();
			const username = config.username?.trim();
			if (!email || !username) {
				continue;
			}

			let user = await this.userRepo.findOne({ where: { email } });
			const passwordHash = bcrypt.hashSync(
				config.password ?? this.DEFAULT_PASSWORD,
				10,
			);
			const firstName = config.firstName ?? "Dev";
			const lastName = config.lastName ?? "User";
			const isActive = config.isActive !== false;
			const isVerified = config.isVerified ?? true;
			const avatarUrl =
				config.avatar ?? user?.avatarUrl ?? faker.image.avatar();
			const subscriptionRole = user?.subscriptionRole?.length
				? user.subscriptionRole
				: ["free"];
			const timezone = user?.timezone ?? "UTC";
			const emailVerifiedAt = isVerified ? randomDateInSeedRange() : null;
			const lastLogin = isActive ? randomDateAfter(emailVerifiedAt) : null;
			const emailVerificationToken = isVerified
				? null
				: (user?.emailVerificationToken ?? faker.string.uuid());

			if (user) {
				user.username = username;
				user.email = email;
				user.password = passwordHash;
				user.firstName = firstName;
				user.lastName = lastName;
				user.avatarUrl = avatarUrl;
				user.isActive = isActive;
				user.banReason = null;
				user.emailVerified = isVerified;
				user.emailVerificationToken = emailVerificationToken;
				user.emailVerifiedAt = emailVerifiedAt;
				user.lastLogin = lastLogin;
				user.timezone = timezone;
				user.isAdmin = false;
				user.isBot = false;
				user.subscriptionRole = subscriptionRole;
			} else {
				user = applySeedTimestamps(
					this.userRepo.create({
						username,
						email,
						password: passwordHash,
						firstName,
						lastName,
						avatarUrl,
						isActive,
						banReason: null,
						emailVerified: isVerified,
						emailVerifiedAt: emailVerifiedAt,
						emailVerificationToken,
						lastLogin,
						timezone,
						isAdmin: false,
						isBot: false,
						subscriptionRole,
					}),
					{ minCreatedAt: emailVerifiedAt },
				);
			}

			if (isVerified && !user.emailVerifiedAt) {
				user.emailVerifiedAt = emailVerifiedAt ?? randomDateInSeedRange();
			}
			if (!isVerified) {
				user.emailVerifiedAt = null;
			}

			const saved = await this.userRepo.save(user);
			ensuredUsers.push(saved);
		}

		if (ensuredUsers.length) {
			console.log(
				`Ensured ${ensuredUsers.length} required users from configuration.`,
			);
		}

		return ensuredUsers;
	}

	private async ensureRequiredUserFriendships(requiredUsers: UserEntity[]) {
		if (!requiredUsers.length) {
			return;
		}

		const ids = requiredUsers.map((user) => user.id);
		if (ids.length < 2) {
			return;
		}

		const existingFriendships = await this.userFriendRepo.find({
			where: [{ userId: In(ids) }, { friendId: In(ids) }],
			select: ["userId", "friendId"],
		});
		const existingPairs = new Set<string>();
		existingFriendships.forEach((friendship) => {
			existingPairs.add(
				this.buildPairKey(friendship.userId, friendship.friendId),
			);
		});

		const newFriendships: UserFriendEntity[] = [];
		for (let i = 0; i < ids.length; i += 1) {
			for (let j = i + 1; j < ids.length; j += 1) {
				const key = this.buildPairKey(ids[i], ids[j]);
				if (existingPairs.has(key)) {
					continue;
				}
				newFriendships.push(
					applySeedTimestamps(
						this.userFriendRepo.create({
							userId: ids[i],
							friendId: ids[j],
						}),
					),
				);
			}
		}

		if (newFriendships.length) {
			await this.userFriendRepo.save(newFriendships);
			console.log(
				`Added ${newFriendships.length} friendships to fully connect required users.`,
			);
		}
	}

	private loadRequiredUsers(): RequiredUserConfig[] {
		const filePath = path.join(__dirname, "../raw-data/required-users.json");
		try {
			const raw = fs.readFileSync(filePath, "utf-8");
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) {
				return [];
			}
			return parsed
				.map((entry) => {
					const email =
						typeof entry.email === "string"
							? entry.email.trim().toLowerCase()
							: "";
					const username =
						typeof entry.username === "string" ? entry.username.trim() : "";
					if (!email || !username) {
						return null;
					}
					return {
						email,
						username,
						password:
							typeof entry.password === "string" ? entry.password : undefined,
						firstName:
							typeof entry.firstName === "string" ? entry.firstName : undefined,
						lastName:
							typeof entry.lastName === "string" ? entry.lastName : undefined,
						isVerified:
							typeof entry.isVerified === "boolean"
								? entry.isVerified
								: undefined,
						isActive:
							typeof entry.isActive === "boolean" ? entry.isActive : undefined,
						avatar:
							typeof entry.avatar === "string" && entry.avatar.trim()
								? entry.avatar.trim()
								: undefined,
					} as RequiredUserConfig;
				})
				.filter((entry): entry is RequiredUserConfig => Boolean(entry));
		} catch (error) {
			console.warn("Unable to load required users config:", error);
			return [];
		}
	}

	private buildPairKey(a: string, b: string) {
		return [a, b].sort().join(":");
	}

	private ensureImportantFriendships(
		users: UserEntity[],
		friendPairs: Set<string>,
		friendEntities: UserFriendEntity[],
		friendCounts: Map<string, number>,
	) {
		const importantUsers = users.filter((user) =>
			this.isImportantEmail(user.email),
		);
		if (!importantUsers.length) return;

		const userPool = users;
		for (const important of importantUsers) {
			if ((friendCounts.get(important.id) ?? 0) > 0) continue;
			const candidates = userPool.filter((user) => user.id !== important.id);
			if (!candidates.length) continue;
			const partner = faker.helpers.arrayElement(candidates);
			const pairKey = this.buildPairKey(important.id, partner.id);
			if (friendPairs.has(pairKey)) continue;
			friendPairs.add(pairKey);
			friendEntities.push(
				applySeedTimestamps(
					this.userFriendRepo.create({
						userId: important.id,
						friendId: partner.id,
					}),
				),
			);
			friendCounts.set(important.id, (friendCounts.get(important.id) ?? 0) + 1);
			friendCounts.set(partner.id, (friendCounts.get(partner.id) ?? 0) + 1);
		}
	}

	private loadImportantEmails(): Set<string> {
		const filePath = path.join(
			__dirname,
			"../raw-data/important-accounts.json",
		);
		try {
			const raw = fs.readFileSync(filePath, "utf-8");
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) {
				return new Set(
					parsed
						.map((email) =>
							typeof email === "string" ? email.trim().toLowerCase() : null,
						)
						.filter((email): email is string => Boolean(email)),
				);
			}
		} catch (error) {
			console.warn("Unable to load important accounts list:", error);
		}
		return new Set();
	}

	private isImportantEmail(email?: string | null) {
		return email ? this.importantEmails.has(email.toLowerCase()) : false;
	}

	private buildUserFilter(): FindOptionsWhere<UserEntity> {
		if (Env.EMAIL_USER) {
			return { isBot: false, email: Not(Env.EMAIL_USER) };
		}
		return { isBot: false };
	}
}
