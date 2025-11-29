import { ReportCategoryEntity, UserEntity } from "@db/entities";
import {
	DirectMessageRepository,
	MessageRepository,
	ReportCategoryRepository,
	ReportReportCategoryRepository,
	ReportRepository,
	ThreadMessageRepository,
	UserRepository,
} from "@db/repositories";
import { MessageTypeEnum } from "@utils";
import { faker } from "@faker-js/faker";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class ReportSeederService {
	private readonly logger = new Logger(ReportSeederService.name);
	private readonly maxReportsPerType = 60;

	constructor(
		private readonly reportCategoryRepo: ReportCategoryRepository,
		private readonly reportRepo: ReportRepository,
		private readonly reportReportCategoryRepo: ReportReportCategoryRepository,
		private readonly userRepo: UserRepository,
		private readonly messageRepo: MessageRepository,
		private readonly directMessageRepo: DirectMessageRepository,
		private readonly threadMessageRepo: ThreadMessageRepository,
	) {}

	async run() {
		const [categories, users, messages, directMessages, threadMessages] =
			await Promise.all([
				this.reportCategoryRepo.find(),
				this.userRepo.find(),
				this.messageRepo.find({ take: 300 }),
				this.directMessageRepo.find({ take: 300 }),
				this.threadMessageRepo.find({ take: 300 }),
			]);

		if (!categories.length) {
			this.logger.warn(
				"No report categories found. Run ReportCategorySeederService first.",
			);
			return;
		}

		if (!users.length) {
			this.logger.warn("No users available. Skipping report seeding.");
			return;
		}

		if (!messages.length && !directMessages.length && !threadMessages.length) {
			this.logger.warn(
				"No messages found to attach reports to. Skipping report seeding.",
			);
			return;
		}

		const pendingReports = [] as Array<{
			categories: string[];
			content: string | null;
			messageType: MessageTypeEnum;
			reporterId: string;
			messageId: string;
		}>;

		this.queueReportsForMessages(
			pendingReports,
			categories,
			users,
			messages,
			MessageTypeEnum.CHANNEL_MESSAGE,
		);
		this.queueReportsForMessages(
			pendingReports,
			categories,
			users,
			directMessages,
			MessageTypeEnum.DIRECT_MESSAGE,
		);
		this.queueReportsForMessages(
			pendingReports,
			categories,
			users,
			threadMessages,
			MessageTypeEnum.THREAD_MESSAGE,
		);

		if (!pendingReports.length) {
			this.logger.log("No eligible reports to seed after filtering. Skipping.");
			return;
		}

		const reportEntities = pendingReports.map((pending) =>
			this.reportRepo.create({
				messageId: pending.messageId,
				messageType: pending.messageType,
				content: pending.content,
				createdById: pending.reporterId,
			}),
		);

		const savedReports = await this.reportRepo.save(reportEntities);

		const pivotEntities = savedReports.flatMap((report, index) =>
			pendingReports[index].categories.map((categoryId) =>
				this.reportReportCategoryRepo.create({
					reportId: report.id,
					reportCategoryId: categoryId,
				}),
			),
		);

		if (pivotEntities.length) {
			await this.reportReportCategoryRepo.save(pivotEntities);
		}

		this.logger.log(
			`Seeded ${savedReports.length} reports linked to ${pivotEntities.length} category relations.`,
		);
	}

	private queueReportsForMessages<T extends { id: string }>(
		pending: Array<{
			categories: string[];
			content: string | null;
			messageType: MessageTypeEnum;
			reporterId: string;
			messageId: string;
		}>,
		categories: ReportCategoryEntity[],
		users: UserEntity[],
		collection: T[],
		type: MessageTypeEnum,
	) {
		if (!collection.length) return;

		const count = Math.min(
			faker.number.int({ min: 1, max: this.maxReportsPerType }),
			collection.length,
		);
		const candidates = faker.helpers.shuffle(collection).slice(0, count);

		for (const item of candidates) {
			const reporter = this.pickReporter(
				users,
				this.extractExcludedUserIds(item, type),
			);
			const categoryIds = this.pickCategories(categories);
			if (!reporter || !categoryIds.length) continue;

			pending.push({
				messageId: item.id,
				messageType: type,
				reporterId: reporter.id,
				categories: categoryIds,
				content:
					faker.helpers.maybe(() => faker.lorem.sentences({ min: 1, max: 2 }), {
						probability: 0.7,
					}) ?? null,
			});
		}
	}

	private pickReporter(users: UserEntity[], excludedIds: Set<string>) {
		const eligible = users.filter((user) => !excludedIds.has(user.id));
		return eligible.length
			? faker.helpers.arrayElement(eligible)
			: faker.helpers.arrayElement(users);
	}

	private extractExcludedUserIds(item: any, type: MessageTypeEnum) {
		const excluded = new Set<string>();
		if (type === MessageTypeEnum.CHANNEL_MESSAGE && item.senderId) {
			excluded.add(item.senderId);
		}
		if (type === MessageTypeEnum.DIRECT_MESSAGE) {
			if (item.fromUserId) excluded.add(item.fromUserId);
			if (item.toUserId) excluded.add(item.toUserId);
		}
		if (type === MessageTypeEnum.THREAD_MESSAGE && item.senderId) {
			excluded.add(item.senderId);
		}
		return excluded;
	}

	private pickCategories(categories: ReportCategoryEntity[]) {
		const count = faker.number.int({
			min: 1,
			max: Math.min(2, categories.length),
		});
		return faker.helpers
			.shuffle(categories)
			.slice(0, count)
			.map((category) => category.id);
	}
}
