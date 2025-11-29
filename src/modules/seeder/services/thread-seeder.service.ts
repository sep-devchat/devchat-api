import { ThreadEntity, UserEntity } from "@db/entities";
import {
	ChannelRepository,
	GroupRepository,
	MessageRepository,
	ThreadRepository,
	UserRepository,
} from "@db/repositories";
import { faker } from "@faker-js/faker";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class ThreadSeederService {
	private readonly logger = new Logger(ThreadSeederService.name);
	private readonly minThreadsPerChannel = 2;
	private readonly maxThreadsPerChannel = 8;

	constructor(
		private readonly groupRepo: GroupRepository,
		private readonly channelRepo: ChannelRepository,
		private readonly threadRepo: ThreadRepository,
		private readonly messageRepo: MessageRepository,
		private readonly userRepo: UserRepository,
	) {}

	async run() {
		const [channels, users, groups] = await Promise.all([
			this.channelRepo.find(),
			this.userRepo.find(),
			this.groupRepo.find(),
		]);

		if (!channels.length) {
			this.logger.warn("No channels available. Skipping thread seeding.");
			return;
		}

		if (!users.length) {
			this.logger.warn("No users available. Skipping thread seeding.");
			return;
		}

		const groupOwnerMap = new Map(
			groups.map((group) => [group.id, group.createdBy]),
		);
		const threadsToInsert: ThreadEntity[] = [];
		const touchedChannelIds = new Set<string>();

		for (const channel of channels) {
			const existingCount = await this.threadRepo.count({
				where: { channelId: channel.id },
			});

			const plannedCount = faker.number.int({
				min: this.minThreadsPerChannel,
				max: this.maxThreadsPerChannel,
			});
			const toCreate = Math.max(plannedCount - existingCount, 0);
			if (!toCreate) continue;

			for (let index = 0; index < toCreate; index += 1) {
				const author = this.pickAuthor(
					users,
					groupOwnerMap.get(channel.groupId),
				);
				const rootMessage = await this.createThreadRootMessage(
					channel.id,
					author,
				);
				threadsToInsert.push(
					this.threadRepo.create({
						channelId: channel.id,
						createdById: author.id,
						messageId: rootMessage.id,
						name: this.buildThreadName(channel.name),
					}),
				);
				touchedChannelIds.add(channel.id);
			}
		}

		if (!threadsToInsert.length) {
			this.logger.log(
				"Threads already exist for every channel. Nothing to seed.",
			);
			return;
		}

		await this.threadRepo.save(threadsToInsert);
		this.logger.log(
			`Seeded ${threadsToInsert.length} threads across ${touchedChannelIds.size} channels.`,
		);
	}

	private pickAuthor(users: UserEntity[], ownerId?: string) {
		if (ownerId) {
			const owner = users.find((user) => user.id === ownerId);
			if (owner && Math.random() < 0.5) {
				return owner;
			}
		}
		return faker.helpers.arrayElement(users);
	}

	private async createThreadRootMessage(channelId: string, author: UserEntity) {
		const message = this.messageRepo.create({
			channelId,
			senderId: author.id,
			content: faker.lorem.paragraph({ min: 1, max: 3 }),
			parentMessageId: null,
			codeBlockId: null,
		});

		return this.messageRepo.save(message);
	}

	private buildThreadName(channelName: string) {
		const topic = faker.hacker.noun();
		return `${channelName}-${topic}-${faker.string.alphanumeric(4).toLowerCase()}`;
	}
}
