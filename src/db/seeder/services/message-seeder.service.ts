import { faker } from "@faker-js/faker";
import {
	ChannelRepository,
	CodeBlockRepository,
	DirectMessageRepository,
	GroupRepository,
	GroupSupportedProgrammingLanguageRepository,
	MessageRepository,
	ThreadMessageRepository,
	ThreadRepository,
	UserFriendRepository,
	UserGroupRepository,
	UserRepository,
} from "@db/repositories";
import { Injectable } from "@nestjs/common";
import { Env } from "@utils";
import * as fs from "fs";
import * as path from "path";
import {
	ChannelEntity,
	DirectMessageEntity,
	GroupSupportedProgrammingLanguageEntity,
	MessageEntity,
	ThreadEntity,
	ThreadMessageEntity,
	UserEntity,
} from "@db/entities";
import { FindOptionsWhere, Not } from "typeorm";

interface CodePreset {
	language: string;
	content: string;
	fileName: string;
}

type ChannelStub = Pick<ChannelEntity, "id" | "groupId">;
type UserStub = Pick<UserEntity, "id">;

@Injectable()
export class MessageSeederService {
	private readonly GROUP_MESSAGE_PER_USER = 15;
	private readonly DIRECT_MESSAGE_PER_USER = 10;
	private readonly THREAD_MESSAGE_PER_THREAD = 5;
	private readonly presetDirectory = path.join(
		__dirname,
		"../raw-data/codeblock-presets",
	);
	private codePresetCache: CodePreset[] | null = null;

	constructor(
		private readonly userRepo: UserRepository,
		private readonly userFriendRepo: UserFriendRepository,
		private readonly groupRepo: GroupRepository,
		private readonly userGroupRepo: UserGroupRepository,
		private readonly groupLanguageRepo: GroupSupportedProgrammingLanguageRepository,
		private readonly channelRepo: ChannelRepository,
		private readonly messageRepo: MessageRepository,
		private readonly threadRepo: ThreadRepository,
		private readonly directMessageRepo: DirectMessageRepository,
		private readonly threadMessageRepo: ThreadMessageRepository,
		private readonly codeBlockRepo: CodeBlockRepository,
	) {}

	async run() {
		const totalGroups = await this.groupRepo.count();
		if (totalGroups === 0) {
			console.warn("No groups found; skipping message seeding.");
			return;
		}

		const codePresets = this.getCodePresets();
		if (!codePresets.length) {
			console.warn(
				"No code block presets available; skipping message seeding.",
			);
			return;
		}

		const [users, channels, memberships, friendships, groupLanguages] =
			await Promise.all([
				this.userRepo.find({
					where: this.buildUserFilter(),
					select: ["id"],
				}),
				this.channelRepo.find({ select: ["id", "groupId"] }),
				this.userGroupRepo.find({ select: ["userId", "groupId"] }),
				this.userFriendRepo.find({ select: ["userId", "friendId"] }),
				this.groupLanguageRepo.find({
					where: { isActive: true },
					relations: ["supportedProgrammingLanguage"],
				}),
			]);

		if (!users.length) {
			console.warn("No eligible users found; skipping message seeding.");
			return;
		}

		if (!channels.length) {
			console.warn("No channels found; skipping message seeding.");
			return;
		}

		if (!memberships.length) {
			console.warn(
				"No user-group memberships found; skipping message seeding.",
			);
			return;
		}

		const { groupMembers, userGroups } = this.buildMembershipMaps(memberships);
		if (!userGroups.size) {
			console.warn(
				"Users are not assigned to any groups; skipping group conversations.",
			);
		}

		const groupLanguageMap = this.buildGroupLanguageMap(groupLanguages);
		const friendMap = this.buildFriendMap(friendships);

		const groupSummary = await this.seedGroupConversations(
			users,
			channels,
			userGroups,
			groupMembers,
			groupLanguageMap,
			codePresets,
		);
		const directMessages = await this.seedDirectMessages(
			users,
			friendMap,
			codePresets,
		);

		console.log(
			`Seeded ${groupSummary.groupMessages} group messages, ${groupSummary.threads} threads, ${groupSummary.threadMessages} thread messages, and ${directMessages} direct messages.`,
		);
	}

	private getCodePresets(): CodePreset[] {
		if (this.codePresetCache) {
			return this.codePresetCache;
		}
		this.codePresetCache = this.loadCodeBlockPresets();
		return this.codePresetCache;
	}

	private loadCodeBlockPresets(): CodePreset[] {
		try {
			if (!fs.existsSync(this.presetDirectory)) {
				return [];
			}
			const entries = fs
				.readdirSync(this.presetDirectory, { withFileTypes: true })
				.filter((entry) => entry.isFile() && entry.name.endsWith(".txt"));
			return entries
				.map((entry) => {
					const nameWithoutExt = entry.name.replace(/\.txt$/i, "");
					const match = nameWithoutExt.match(/^([a-zA-Z]+)/);
					if (!match) {
						return null;
					}
					const language = match[1].toLowerCase();
					const content = fs
						.readFileSync(path.join(this.presetDirectory, entry.name), "utf-8")
						.trim();
					if (!content) {
						return null;
					}
					return { language, content, fileName: entry.name };
				})
				.filter((preset): preset is CodePreset => Boolean(preset));
		} catch (error) {
			console.warn("Unable to load code block presets:", error);
			return [];
		}
	}

	private buildMembershipMaps(
		records: {
			userId: string;
			groupId: string;
		}[],
	): {
		groupMembers: Map<string, Set<string>>;
		userGroups: Map<string, Set<string>>;
	} {
		const groupMembers = new Map<string, Set<string>>();
		const userGroups = new Map<string, Set<string>>();
		for (const record of records) {
			if (!groupMembers.has(record.groupId)) {
				groupMembers.set(record.groupId, new Set());
			}
			groupMembers.get(record.groupId)!.add(record.userId);

			if (!userGroups.has(record.userId)) {
				userGroups.set(record.userId, new Set());
			}
			userGroups.get(record.userId)!.add(record.groupId);
		}
		return { groupMembers, userGroups };
	}

	private buildGroupLanguageMap(
		entries: GroupSupportedProgrammingLanguageEntity[],
	): Map<string, string[]> {
		const result = new Map<string, string[]>();
		for (const entry of entries) {
			const languageCode = entry.supportedProgrammingLanguage?.languageCode;
			if (!languageCode) {
				continue;
			}
			const normalized = languageCode.toLowerCase();
			const existing = result.get(entry.groupId) ?? [];
			if (!existing.includes(normalized)) {
				existing.push(normalized);
			}
			result.set(entry.groupId, existing);
		}
		return result;
	}

	private buildFriendMap(records: { userId: string; friendId: string }[]) {
		const interim = new Map<string, Set<string>>();
		for (const record of records) {
			if (record.userId === record.friendId) {
				continue;
			}
			if (!interim.has(record.userId)) {
				interim.set(record.userId, new Set());
			}
			if (!interim.has(record.friendId)) {
				interim.set(record.friendId, new Set());
			}
			interim.get(record.userId)!.add(record.friendId);
			interim.get(record.friendId)!.add(record.userId);
		}
		const friendMap = new Map<string, string[]>();
		interim.forEach((set, key) => {
			friendMap.set(key, Array.from(set));
		});
		return friendMap;
	}

	private buildUserFilter(): FindOptionsWhere<UserEntity> {
		if (Env.EMAIL_USER) {
			return { isBot: false, email: Not(Env.EMAIL_USER) };
		}
		return { isBot: false };
	}

	private async seedGroupConversations(
		users: UserStub[],
		channels: ChannelStub[],
		userGroups: Map<string, Set<string>>,
		groupMembers: Map<string, Set<string>>,
		groupLanguageMap: Map<string, string[]>,
		codePresets: CodePreset[],
	): Promise<{
		groupMessages: number;
		threads: number;
		threadMessages: number;
	}> {
		if (!userGroups.size) {
			return { groupMessages: 0, threads: 0, threadMessages: 0 };
		}

		const groupChannels = new Map<string, ChannelStub[]>();
		const channelGroupMap = new Map<string, string>();
		for (const channel of channels) {
			channelGroupMap.set(channel.id, channel.groupId);
			const entries = groupChannels.get(channel.groupId) ?? [];
			entries.push(channel);
			groupChannels.set(channel.groupId, entries);
		}

		const groupMessages: MessageEntity[] = [];
		for (const user of users) {
			const memberGroups = userGroups.get(user.id);
			if (!memberGroups?.size) {
				continue;
			}
			memberGroups.forEach((groupId) => {
				const groupSpecificChannels = groupChannels.get(groupId);
				if (!groupSpecificChannels?.length) {
					return;
				}
				const messageCount = this.randomCount(this.GROUP_MESSAGE_PER_USER);
				if (!messageCount) {
					return;
				}
				for (let index = 0; index < messageCount; index += 1) {
					const channel = faker.helpers.arrayElement(groupSpecificChannels);
					const allowedLanguages = groupLanguageMap.get(groupId);
					const preset = this.pickPreset(codePresets, allowedLanguages);
					if (!preset) {
						continue;
					}
					groupMessages.push(
						this.messageRepo.create({
							channelId: channel.id,
							senderId: user.id,
							parentMessageId: null,
							content: this.buildMessageContent(
								preset.language,
								preset.content,
							),
							codeBlock: this.createCodeBlock(
								user.id,
								preset.language,
								preset.content,
								channel.id,
							),
						}),
					);
				}
			});
		}

		if (!groupMessages.length) {
			return { groupMessages: 0, threads: 0, threadMessages: 0 };
		}

		const savedMessages = await this.messageRepo.save(groupMessages);
		const desiredThreadCount = Math.max(
			1,
			Math.floor(savedMessages.length * 0.3),
		);
		const shuffledMessages = faker.helpers.shuffle(savedMessages);
		const threadBases = shuffledMessages.slice(0, desiredThreadCount);

		const threadEntities: ThreadEntity[] = [];
		for (const baseMessage of threadBases) {
			const groupId = channelGroupMap.get(baseMessage.channelId);
			if (!groupId || !groupMembers.get(groupId)?.size) {
				continue;
			}
			threadEntities.push(
				this.threadRepo.create({
					name: this.buildThreadName(),
					messageId: baseMessage.id,
					channelId: baseMessage.channelId,
					createdById: baseMessage.senderId,
				}),
			);
		}

		const savedThreads = threadEntities.length
			? await this.threadRepo.save(threadEntities)
			: [];

		const threadMessages: ThreadMessageEntity[] = [];
		for (const thread of savedThreads) {
			const groupId = channelGroupMap.get(thread.channelId);
			if (!groupId) {
				continue;
			}
			const memberIds = Array.from(groupMembers.get(groupId) ?? []);
			if (!memberIds.length) {
				continue;
			}
			const participantSample = faker.helpers
				.shuffle(memberIds)
				.slice(
					0,
					Math.min(
						memberIds.length,
						Math.max(1, Math.ceil(memberIds.length / 3)),
					),
				);
			for (const participantId of participantSample) {
				const replyCount = this.randomCount(this.THREAD_MESSAGE_PER_THREAD);
				if (!replyCount) {
					continue;
				}
				for (let index = 0; index < replyCount; index += 1) {
					const preset = this.pickPreset(
						codePresets,
						groupLanguageMap.get(groupId),
					);
					if (!preset) {
						continue;
					}
					threadMessages.push(
						this.threadMessageRepo.create({
							threadId: thread.id,
							channelId: thread.channelId,
							senderId: participantId,
							parentMessageId: null,
							content: this.buildMessageContent(
								preset.language,
								preset.content,
							),
							codeBlock: this.createCodeBlock(
								participantId,
								preset.language,
								preset.content,
								thread.channelId,
							),
						}),
					);
				}
			}
		}

		const savedThreadMessages = threadMessages.length
			? await this.threadMessageRepo.save(threadMessages)
			: [];

		return {
			groupMessages: savedMessages.length,
			threads: savedThreads.length,
			threadMessages: savedThreadMessages.length,
		};
	}

	private async seedDirectMessages(
		users: UserStub[],
		friendMap: Map<string, string[]>,
		codePresets: CodePreset[],
	): Promise<number> {
		if (!friendMap.size) {
			console.warn("No friendships found; skipping direct messages.");
			return 0;
		}

		const directMessages: DirectMessageEntity[] = [];
		const processedPairs = new Set<string>();
		for (const user of users) {
			const friends = friendMap.get(user.id);
			if (!friends?.length) {
				continue;
			}
			for (const friendId of friends) {
				if (user.id === friendId) {
					continue;
				}
				const pairKey = this.buildPairKey(user.id, friendId);
				if (processedPairs.has(pairKey)) {
					continue;
				}
				processedPairs.add(pairKey);

				const outboundCount = this.randomCount(this.DIRECT_MESSAGE_PER_USER);
				const inboundCount = this.randomCount(this.DIRECT_MESSAGE_PER_USER);

				this.collectDirectMessages(
					directMessages,
					user.id,
					friendId,
					outboundCount,
					codePresets,
				);
				this.collectDirectMessages(
					directMessages,
					friendId,
					user.id,
					inboundCount,
					codePresets,
				);
			}
		}

		if (!directMessages.length) {
			return 0;
		}

		const savedDirectMessages =
			await this.directMessageRepo.save(directMessages);
		return savedDirectMessages.length;
	}

	private pickPreset(
		presets: CodePreset[],
		allowedLanguages?: string[],
	): CodePreset | null {
		if (!presets.length) {
			return null;
		}
		if (allowedLanguages?.length) {
			const normalized = allowedLanguages.map((lang) => lang.toLowerCase());
			const matches = presets.filter((preset) =>
				normalized.includes(preset.language),
			);
			if (matches.length) {
				return faker.helpers.arrayElement(matches);
			}
		}
		return faker.helpers.arrayElement(presets);
	}

	private buildMessageContent(language: string, code: string) {
		const heading = `# ${faker.company.buzzPhrase()}`;
		const listItems = [faker.hacker.phrase(), faker.company.catchPhrase()];
		const lines = [
			heading,
			"Message in this app support markdown format.",
			`* ${listItems[0]}`,
			`* **${listItems[1]}**`,
			"",
			"```" + language,
			code.trim(),
			"```",
		];
		return lines.join("\n");
	}

	private buildThreadName() {
		return `${faker.hacker.noun()} discussion`.slice(0, 120);
	}

	private createCodeBlock(
		userId: string,
		language: string,
		content: string,
		channelId?: string | null,
		toUserId?: string | null,
	) {
		return this.codeBlockRepo.create({
			userId,
			toUserId: toUserId ?? null,
			channelId: channelId ?? null,
			language,
			content: content.trim(),
		});
	}

	private randomCount(limit: number) {
		const safeLimit = Math.max(0, limit);
		if (!safeLimit) {
			return 0;
		}
		const min = Math.max(1, Math.ceil(safeLimit / 2));
		return faker.number.int({
			min,
			max: safeLimit,
		});
	}

	private buildPairKey(a: string, b: string) {
		return [a, b].sort().join(":");
	}

	private collectDirectMessages(
		bucket: DirectMessageEntity[],
		fromUserId: string,
		toUserId: string,
		count: number,
		codePresets: CodePreset[],
	) {
		for (let index = 0; index < count; index += 1) {
			const preset = this.pickPreset(codePresets);
			if (!preset) {
				return;
			}
			bucket.push(
				this.directMessageRepo.create({
					fromUserId,
					toUserId,
					parentMessageId: null,
					content: this.buildMessageContent(preset.language, preset.content),
					codeBlock: this.createCodeBlock(
						fromUserId,
						preset.language,
						preset.content,
						null,
						toUserId,
					),
				}),
			);
		}
	}
}
