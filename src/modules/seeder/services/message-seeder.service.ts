import {
	ChannelEntity,
	MessageEntity,
	ThreadEntity,
	ThreadMessageEntity,
	UserEntity,
} from "@db/entities";
import {
	AttachmentRepository,
	ChannelRepository,
	DirectMessageRepository,
	CodeBlockRepository,
	MessageRepository,
	ThreadMessageRepository,
	ThreadRepository,
	UserRepository,
} from "@db/repositories";
import { faker } from "@faker-js/faker";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class MessageSeederService {
	private readonly logger = new Logger(MessageSeederService.name);
	private readonly minChannelMessages = 40;
	private readonly maxChannelMessages = 120;
	private readonly maxThreadReplies = 20;
	private readonly attachmentProbability = 0.25;
	private readonly codeBlockProbability = 0.18;
	private readonly maxAttachmentsPerMessage = 2;
	private readonly directConversationPairs = 60;

	constructor(
		private readonly userRepo: UserRepository,
		private readonly channelRepo: ChannelRepository,
		private readonly threadRepo: ThreadRepository,
		private readonly messageRepo: MessageRepository,
		private readonly directMessageRepo: DirectMessageRepository,
		private readonly threadMessageRepo: ThreadMessageRepository,
		private readonly attachmentRepo: AttachmentRepository,
		private readonly codeBlockRepo: CodeBlockRepository,
	) {}

	async run() {
		const [users, channels, threads] = await Promise.all([
			this.userRepo.find(),
			this.channelRepo.find(),
			this.threadRepo.find(),
		]);

		if (!users.length) {
			this.logger.warn("No users available. Skipping message seeding.");
			return;
		}

		if (!channels.length) {
			this.logger.warn(
				"No channels available. Skipping channel message seeding.",
			);
		}

		const [channelMessages, threadReplies, directMessages] = await Promise.all([
			this.seedChannelMessages(channels, users),
			this.seedThreadMessages(threads, users),
			this.seedDirectMessages(users),
		]);

		this.logger.log(
			`Seeded ${channelMessages} channel messages, ${threadReplies} thread replies, and ${directMessages} direct messages.`,
		);
	}

	private async seedChannelMessages(
		channels: ChannelEntity[],
		users: UserEntity[],
	) {
		if (!channels.length) return 0;

		let inserted = 0;
		for (const channel of channels) {
			const existingCount = await this.messageRepo.count({
				where: { channelId: channel.id },
			});
			if (existingCount >= this.minChannelMessages) continue;

			const targetCount = faker.number.int({
				min: this.minChannelMessages,
				max: this.maxChannelMessages,
			});
			const toCreate = Math.max(targetCount - existingCount, 0);
			if (!toCreate) continue;

			const newMessages = Array.from({ length: toCreate }, () => {
				const author = this.pickChannelAuthor(users, channel.createdBy);
				return this.messageRepo.create({
					channelId: channel.id,
					senderId: author.id,
					content: this.buildChannelMessageContent(channel.name),
					parentMessageId: null,
					codeBlockId: null,
				});
			});

			const savedMessages = await this.messageRepo.save(newMessages);
			inserted += savedMessages.length;

			await Promise.all(
				savedMessages.map((message) =>
					this.enrichChannelMessage(channel, message),
				),
			);
		}

		return inserted;
	}

	private async enrichChannelMessage(
		channel: ChannelEntity,
		message: MessageEntity,
	) {
		const tasks: Promise<unknown>[] = [];

		if (Math.random() < this.codeBlockProbability) {
			tasks.push(this.createCodeBlockForMessage(channel.id, message));
		}

		if (Math.random() < this.attachmentProbability) {
			const attachments = this.buildAttachments(channel.id, message);
			tasks.push(this.attachmentRepo.save(attachments));
		}

		await Promise.all(tasks);
	}

	private async seedThreadMessages(
		threads: ThreadEntity[],
		users: UserEntity[],
	) {
		if (!threads.length) return 0;

		let inserted = 0;
		for (const thread of threads) {
			const existingCount = await this.threadMessageRepo.count({
				where: { threadId: thread.id },
			});
			const targetCount = faker.number.int({
				min: 1,
				max: this.maxThreadReplies,
			});
			const toCreate = Math.max(targetCount - existingCount, 0);
			if (!toCreate) continue;

			let parentMessageId: string | null = null;
			for (let index = 0; index < toCreate; index += 1) {
				const sender = this.pickThreadParticipant(users, thread.createdById);
				const entity = this.threadMessageRepo.create({
					threadId: thread.id,
					channelId: thread.channelId,
					senderId: sender.id,
					content: this.buildThreadMessageContent(),
					parentMessageId,
					codeBlockId: null,
				});

				const saved = await this.threadMessageRepo.save(entity);
				inserted += 1;
				parentMessageId = Math.random() < 0.4 ? saved.id : parentMessageId;
				await this.enrichThreadMessage(thread, saved);
			}
		}

		return inserted;
	}

	private async seedDirectMessages(users: UserEntity[]) {
		if (users.length < 2) {
			return 0;
		}

		const existing = await this.directMessageRepo.count();
		if (existing > 0) {
			return 0;
		}

		const targetPairs = Math.min(
			this.directConversationPairs,
			Math.floor(users.length / 2),
		);
		if (!targetPairs) {
			return 0;
		}

		const pairKeys = new Set<string>();
		let inserted = 0;
		let attempts = 0;
		const maxAttempts = targetPairs * 5;

		while (pairKeys.size < targetPairs && attempts < maxAttempts) {
			attempts += 1;
			const [first, second] = faker.helpers.shuffle([...users]).slice(0, 2);
			if (!first || !second || first.id === second.id) continue;

			const key = this.buildPairKey(first.id, second.id);
			if (pairKeys.has(key)) continue;
			pairKeys.add(key);

			const messageCount = faker.number.int({ min: 3, max: 8 });
			let parentMessageId: string | null = null;
			for (let index = 0; index < messageCount; index += 1) {
				const fromUser = index % 2 === 0 ? first : second;
				const toUser = fromUser.id === first.id ? second : first;
				const entity = this.directMessageRepo.create({
					fromUserId: fromUser.id,
					toUserId: toUser.id,
					content: this.buildDirectMessageContent(),
					parentMessageId,
					codeBlockId: null,
				});

				const saved = await this.directMessageRepo.save(entity);
				inserted += 1;
				parentMessageId = Math.random() < 0.5 ? saved.id : parentMessageId;
			}
		}

		return inserted;
	}

	private pickChannelAuthor(users: UserEntity[], ownerId: string) {
		const owner = users.find((user) => user.id === ownerId);
		if (owner && Math.random() < 0.5) {
			return owner;
		}
		return faker.helpers.arrayElement(users);
	}

	private pickThreadParticipant(users: UserEntity[], creatorId: string) {
		if (Math.random() < 0.4) {
			return (
				users.find((user) => user.id === creatorId) ??
				faker.helpers.arrayElement(users)
			);
		}
		return faker.helpers.arrayElement(users);
	}

	private buildChannelMessageContent(channelName: string) {
		const intro = `### ${faker.company.catchPhrase()} (#${channelName})`;
		const paragraph = faker.lorem.paragraph();
		const bullets = this.buildBulletList(3);
		const callout = `> ${faker.company.buzzPhrase()} update from ${faker.person.firstName()}`;
		return `${intro}\n\n${paragraph}\n\n${bullets}\n\n${callout}`;
	}

	private buildThreadMessageContent() {
		const quote = `> ${faker.lorem.sentence()}`;
		const checklist = this.buildChecklist(2);
		const maybeCode =
			Math.random() < 0.4
				? `\n\n\`\`\`${faker.helpers.arrayElement(["ts", "js", "py"])}\n${faker.hacker.verb()}(${faker.hacker.noun()});\n\`\`\``
				: "";
		return `${quote}\n\n${checklist}${maybeCode}`;
	}

	private buildDirectMessageContent() {
		const greeting = `**${faker.person.firstName()}** pinged you:`;
		const body = faker.lorem.sentences({ min: 1, max: 2 });
		const bullets = this.buildBulletList(2);
		return `${greeting}\n\n${body}\n\n${bullets}`;
	}

	private buildBulletList(count: number) {
		return Array.from(
			{ length: count },
			() => `- ${faker.hacker.phrase()}`,
		).join("\n");
	}

	private buildChecklist(count: number) {
		return Array.from(
			{ length: count },
			() => `- [ ] ${faker.company.buzzVerb()} ${faker.company.buzzNoun()}`,
		).join("\n");
	}

	private buildAttachments(channelId: string, message: MessageEntity) {
		const attachmentCount = faker.number.int({
			min: 1,
			max: this.maxAttachmentsPerMessage,
		});
		return Array.from({ length: attachmentCount }, () =>
			this.attachmentRepo.create({
				messageId: message.id,
				channelId,
				threadId: null,
				toUserId: null,
				fileName: faker.system.fileName(),
				originalFileName: faker.system.fileName(),
				filePath: faker.system.filePath(),
				fileSize: faker.number.int({ min: 1024, max: 1048576 }),
				fileType: faker.system.mimeType(),
				folder: "seed",
				format: faker.system.fileExt(),
				publicId: faker.string.uuid(),
				uploadedBy: message.senderId,
			}),
		);
	}

	private async enrichThreadMessage(
		thread: ThreadEntity,
		message: ThreadMessageEntity,
	) {
		const tasks: Promise<unknown>[] = [];

		if (Math.random() < this.codeBlockProbability) {
			tasks.push(this.createCodeBlockForThreadMessage(thread, message));
		}

		if (Math.random() < this.attachmentProbability) {
			const attachments = this.buildThreadAttachments(thread, message);
			tasks.push(this.attachmentRepo.save(attachments));
		}

		await Promise.all(tasks);
	}

	private buildThreadAttachments(
		thread: ThreadEntity,
		message: ThreadMessageEntity,
	) {
		const attachmentCount = faker.number.int({
			min: 1,
			max: this.maxAttachmentsPerMessage,
		});
		return Array.from({ length: attachmentCount }, () =>
			this.attachmentRepo.create({
				messageId: null,
				channelId: thread.channelId,
				threadId: thread.id,
				toUserId: null,
				fileName: faker.system.fileName(),
				originalFileName: faker.system.fileName(),
				filePath: faker.system.filePath(),
				fileSize: faker.number.int({ min: 1024, max: 524288 }),
				fileType: faker.system.mimeType(),
				folder: "seed-thread",
				format: faker.system.fileExt(),
				publicId: faker.string.uuid(),
				uploadedBy: message.senderId,
			}),
		);
	}

	private async createCodeBlockForMessage(
		channelId: string,
		message: MessageEntity,
	) {
		const codeBlock = await this.codeBlockRepo.save(
			this.codeBlockRepo.create({
				userId: message.senderId,
				toUserId: null,
				channelId,
				language: faker.helpers.arrayElement(["ts", "js", "py", "go"]),
				content: faker.lorem.lines({ min: 2, max: 6 }),
			}),
		);

		await this.messageRepo.update(message.id, { codeBlockId: codeBlock.id });
	}

	private async createCodeBlockForThreadMessage(
		thread: ThreadEntity,
		message: ThreadMessageEntity,
	) {
		const codeBlock = await this.codeBlockRepo.save(
			this.codeBlockRepo.create({
				userId: message.senderId,
				toUserId: null,
				channelId: thread.channelId,
				language: faker.helpers.arrayElement(["ts", "js", "java", "py"]),
				content: faker.lorem.lines({ min: 2, max: 5 }),
			}),
		);

		await this.threadMessageRepo.update(message.id, {
			codeBlockId: codeBlock.id,
		});
	}

	private buildPairKey(a: string, b: string) {
		return [a, b].sort().join(":");
	}
}
