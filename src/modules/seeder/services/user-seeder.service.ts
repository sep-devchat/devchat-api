import {
	FriendRequestRepository,
	UserFriendRepository,
	UserRepository,
} from "@db/repositories";
import { Injectable, Logger } from "@nestjs/common";
import { faker } from "@faker-js/faker";
import {
	FriendRequestEntity,
	UserEntity,
	UserFriendEntity,
} from "@db/entities";

@Injectable()
export class UserSeederService {
	private readonly logger = new Logger(UserSeederService.name);

	constructor(
		private readonly userRepo: UserRepository,
		private readonly friendRequestRepo: FriendRequestRepository,
		private readonly userFriendRepo: UserFriendRepository,
	) {}

	async run() {
		const users = await this.ensureUsers();
		if (!users.length) {
			return;
		}
		await this.seedFriendships(users);
	}

	private async ensureUsers() {
		const existingUsers = await this.userRepo.find();
		if (!existingUsers.length) {
			this.logger.warn(
				"No users found in database. User seeder will skip creating mock data.",
			);
		} else {
			this.logger.log(
				`Using ${existingUsers.length} existing users for friendship seeding.`,
			);
		}
		return existingUsers;
	}

	private async seedFriendships(users: UserEntity[]) {
		if (users.length < 2) {
			this.logger.warn("Not enough users to seed friendships.");
			return;
		}

		const friendPairs = new Set<string>();
		const pendingRequests = new Set<string>();
		const friendEntities: UserFriendEntity[] = [];
		const requestEntities: FriendRequestEntity[] = [];

		for (const user of users) {
			const candidateCount = faker.number.int({
				min: 0,
				max: Math.min(4, users.length - 1),
			});
			if (!candidateCount) continue;
			const candidates = faker.helpers
				.shuffle(users.filter((candidate) => candidate.id !== user.id))
				.slice(0, candidateCount);

			for (const candidate of candidates) {
				const pairKey = this.buildPairKey(user.id, candidate.id);
				if (friendPairs.has(pairKey)) continue;

				if (Math.random() < 0.6) {
					friendPairs.add(pairKey);
					friendEntities.push(
						this.userFriendRepo.create({
							userId: user.id,
							friendId: candidate.id,
						}),
					);
					continue;
				}

				const requestKey = `${user.id}->${candidate.id}`;
				const reverseKey = `${candidate.id}->${user.id}`;
				if (
					pendingRequests.has(requestKey) ||
					pendingRequests.has(reverseKey)
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

		if (friendEntities.length) {
			await this.userFriendRepo.save(friendEntities);
		}
		if (requestEntities.length) {
			await this.friendRequestRepo.save(requestEntities);
		}

		this.logger.log(
			`Seeded ${friendEntities.length} friendships and ${requestEntities.length} pending friend requests.`,
		);
	}

	private buildPairKey(a: string, b: string) {
		return [a, b].sort().join(":");
	}
}
