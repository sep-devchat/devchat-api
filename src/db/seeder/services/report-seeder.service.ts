import { faker } from "@faker-js/faker";
import { MessageTypeEnum, Env } from "@utils";
import {
	ChannelRepository,
	DirectMessageRepository,
	GroupRepository,
	MessageRepository,
	ReportCategoryRepository,
	ReportReportCategoryRepository,
	ReportRepository,
	ThreadMessageRepository,
	ThreadRepository,
	UserGroupRepository,
	UserRepository,
} from "@db/repositories";
import { Injectable } from "@nestjs/common";
import {
	ChannelEntity,
	DirectMessageEntity,
	MessageEntity,
	ReportCategoryEntity,
	ReportEntity,
	ThreadMessageEntity,
	ThreadEntity,
	UserEntity,
} from "@db/entities";
import { FindOptionsWhere, Not } from "typeorm";

type MessageStub = Pick<MessageEntity, "id" | "channelId" | "senderId">;
type ThreadMessageStub = Pick<
	ThreadMessageEntity,
	"id" | "threadId" | "senderId"
>;
type ThreadStub = Pick<ThreadEntity, "id" | "channelId">;
type ChannelStub = Pick<ChannelEntity, "id" | "groupId">;
type DirectMessageStub = Pick<
	DirectMessageEntity,
	"id" | "fromUserId" | "toUserId"
>;
type UserStub = Pick<UserEntity, "id">;

@Injectable()
export class ReportSeederService {
	private readonly TARGET_REPORTS = 120;
	private readonly MAX_CATEGORIES_PER_REPORT = 3;

	constructor(
		private readonly messageRepo: MessageRepository,
		private readonly directMessageRepo: DirectMessageRepository,
		private readonly threadMessageRepo: ThreadMessageRepository,
		private readonly reportCategoryRepo: ReportCategoryRepository,
		private readonly userRepo: UserRepository,
		private readonly reportRepo: ReportRepository,
		private readonly reportReportCategoryRepo: ReportReportCategoryRepository,
		private readonly groupRepo: GroupRepository,
		private readonly userGroupRepo: UserGroupRepository,
		private readonly channelRepo: ChannelRepository,
		private readonly threadRepo: ThreadRepository,
	) {}

	async run() {
		const [users, categories, groupMemberships] = await Promise.all([
			this.userRepo.find({
				where: this.buildUserFilter(),
				select: ["id"],
			}),
			this.reportCategoryRepo.find({ where: { isRemoved: false } }),
			this.userGroupRepo.find({ select: ["groupId", "userId"] }),
		]);

		if (!users.length) {
			console.warn("No eligible users found; skipping reports seeding.");
			return;
		}

		if (!categories.length) {
			console.warn("No report categories available; skipping reports seeding.");
			return;
		}

		const existingReports = await this.reportRepo.count();
		const reportsNeeded = Math.max(this.TARGET_REPORTS - existingReports, 0);
		if (!reportsNeeded) {
			console.log("Report target already met; skipping seeding.");
			return;
		}

		const [messages, directMessages, threadMessages, threads, channels] =
			await Promise.all([
				this.messageRepo.find({ select: ["id", "channelId", "senderId"] }),
				this.directMessageRepo.find({
					select: ["id", "fromUserId", "toUserId"],
				}),
				this.threadMessageRepo.find({ select: ["id", "threadId", "senderId"] }),
				this.threadRepo.find({ select: ["id", "channelId"] }),
				this.channelRepo.find({ select: ["id", "groupId"] }),
			]);

		if (!messages.length && !directMessages.length && !threadMessages.length) {
			console.warn("No messages available to report.");
			return;
		}

		const groupMembers = this.buildGroupMembers(groupMemberships);
		const threadMap = new Map<string, ThreadStub>();
		threads.forEach((thread) => threadMap.set(thread.id, thread));
		const channelMap = new Map<string, ChannelStub>();
		channels.forEach((channel) => channelMap.set(channel.id, channel));

		const baseCandidates = this.buildCandidates(
			messages,
			threadMessages,
			directMessages,
			threadMap,
			channelMap,
		);
		if (!baseCandidates.length) {
			console.warn("No reportable candidates found.");
			return;
		}

		const selectedCandidates = faker.helpers.arrayElements(
			baseCandidates,
			Math.min(reportsNeeded, baseCandidates.length),
		);

		const reports: ReportEntity[] = [];
		for (const candidate of selectedCandidates) {
			const reporterId = this.pickReporter(candidate, users, groupMembers);
			if (!reporterId) {
				continue;
			}
			reports.push(
				this.reportRepo.create({
					messageId: candidate.messageId,
					messageType: candidate.type,
					content: faker.helpers.maybe(() => faker.lorem.sentence(), {
						probability: 0.5,
					}),
					createdById: reporterId,
				}),
			);
		}

		if (!reports.length) {
			console.warn("Unable to create any reports based on available data.");
			return;
		}

		const savedReports = await this.reportRepo.save(reports);
		const reportCategories = this.assignCategories(savedReports, categories);
		if (reportCategories.length) {
			await this.reportReportCategoryRepo.save(reportCategories);
		}

		console.log(
			`Seeded ${savedReports.length} reports with ${reportCategories.length} report-category links.`,
		);
	}

	private buildGroupMembers(records: { groupId: string; userId: string }[]) {
		const map = new Map<string, Set<string>>();
		for (const record of records) {
			const current = map.get(record.groupId) ?? new Set<string>();
			current.add(record.userId);
			map.set(record.groupId, current);
		}
		return map;
	}

	private buildCandidates(
		messages: MessageStub[],
		threadMessages: ThreadMessageStub[],
		directMessages: DirectMessageStub[],
		threadMap: Map<string, ThreadStub>,
		channelMap: Map<string, ChannelStub>,
	) {
		const candidates: Array<{
			messageId: string;
			type: MessageTypeEnum;
			senderId: string;
			channelId?: string;
			groupId?: string;
			participants?: string[];
		}> = [];

		for (const message of messages) {
			const channel = channelMap.get(message.channelId);
			if (!channel) continue;
			candidates.push({
				messageId: message.id,
				type: MessageTypeEnum.CHANNEL_MESSAGE,
				senderId: message.senderId,
				channelId: channel.id,
				groupId: channel.groupId,
			});
		}

		for (const threadMessage of threadMessages) {
			const thread = threadMap.get(threadMessage.threadId);
			if (!thread) continue;
			const channel = channelMap.get(thread.channelId);
			if (!channel) continue;
			candidates.push({
				messageId: threadMessage.id,
				type: MessageTypeEnum.THREAD_MESSAGE,
				senderId: threadMessage.senderId,
				channelId: channel.id,
				groupId: channel.groupId,
			});
		}

		for (const dm of directMessages) {
			candidates.push({
				messageId: dm.id,
				type: MessageTypeEnum.DIRECT_MESSAGE,
				senderId: dm.fromUserId,
				participants: [dm.fromUserId, dm.toUserId],
			});
		}

		return candidates;
	}

	private pickReporter(
		candidate: {
			messageId: string;
			type: MessageTypeEnum;
			senderId: string;
			groupId?: string;
			participants?: string[];
		},
		users: UserStub[],
		groupMembers: Map<string, Set<string>>,
	) {
		if (candidate.type === MessageTypeEnum.DIRECT_MESSAGE) {
			const pool = candidate.participants?.filter(
				(userId) => userId !== candidate.senderId,
			);
			return pool?.length
				? faker.helpers.arrayElement(pool)
				: faker.helpers.arrayElement(users).id;
		}

		if (candidate.groupId) {
			const members = groupMembers.get(candidate.groupId);
			const pool = members
				? Array.from(members).filter(
						(memberId) => memberId !== candidate.senderId,
					)
				: [];
			if (pool.length) {
				return faker.helpers.arrayElement(pool);
			}
		}

		const fallbackPool = users
			.map((user) => user.id)
			.filter((userId) => userId !== candidate.senderId);
		return fallbackPool.length
			? faker.helpers.arrayElement(fallbackPool)
			: faker.helpers.arrayElement(users).id;
	}

	private assignCategories(
		reports: ReportEntity[],
		categories: ReportCategoryEntity[],
	) {
		const links = [];
		for (const report of reports) {
			const max = Math.min(this.MAX_CATEGORIES_PER_REPORT, categories.length);
			const count = faker.number.int({ min: 1, max });
			const picked = faker.helpers.shuffle(categories).slice(0, count);
			for (const category of picked) {
				links.push(
					this.reportReportCategoryRepo.create({
						reportId: report.id,
						reportCategoryId: category.id,
					}),
				);
			}
		}
		return links;
	}

	private buildUserFilter(): FindOptionsWhere<UserEntity> {
		if (Env.EMAIL_USER) {
			return { isBot: false, email: Not(Env.EMAIL_USER) };
		}
		return { isBot: false };
	}
}
