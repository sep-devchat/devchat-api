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
import { ProgrammingLanguageProficiencyLevel } from "@utils";

@Injectable()
export class UserSeederService {
	private readonly TOTAL_USERS = 30;
	private readonly MAX_CONNECTIONS_PER_USER = 4;
	private readonly DEFAULT_PASSWORD = "Admin@123";
	private readonly importantEmails = this.loadImportantEmails();

	constructor(
		private readonly userRepo: UserRepository,
		private readonly userFriendRepo: UserFriendRepository,
		private readonly friendRequestRepo: FriendRequestRepository,
		private readonly programmingLanguageRepo: SupportedProgrammingLanguageRepository,
		private readonly userLanguageCollectionRepo: UserLanguageCollectionRepository,
	) {}

	async run() {
		const existingUsersCount = await this.userRepo.count({
			where: { isBot: false },
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

		const allUsers = await this.userRepo.find({ where: { isBot: false } });
		await this.seedConnections(allUsers);
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
				const emailVerifiedAt = emailVerified
					? faker.date.recent({ days: 120 })
					: null;
				const timezone = faker.location.timeZone();
				const lastLogin = emailVerified
					? faker.date.recent({ days: 30 })
					: null;
				return this.userRepo.create({
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
				});
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
					this.userLanguageCollectionRepo.create({
						userId: user.id,
						languageId: language.id,
						proficiencyLevel: faker.helpers.arrayElement(levels),
						orderIndex,
						createdBy: user.id,
						updatedBy: user.id,
						isActive: true,
					}),
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
						this.userFriendRepo.create({
							userId: user.id,
							friendId: candidate.id,
						}),
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
					this.friendRequestRepo.create({
						fromUserId: user.id,
						toUserId: candidate.id,
						message: faker.helpers.maybe(() => faker.lorem.sentence(), {
							probability: 0.4,
						}),
						createdBy: user.id,
					}),
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
				this.userFriendRepo.create({
					userId: important.id,
					friendId: partner.id,
				}),
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
}
