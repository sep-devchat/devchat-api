import { NotificationRepository, UserRepository } from "@db/repositories";
import { faker } from "@faker-js/faker";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class NotificationSeederService {
	private readonly logger = new Logger(NotificationSeederService.name);
	private readonly minPerUser = 5;
	private readonly maxPerUser = 15;
	private readonly sources = [
		"task",
		"friend-request",
		"system",
		"mention",
		"code-collaboration",
	];

	constructor(
		private readonly notificationRepo: NotificationRepository,
		private readonly userRepo: UserRepository,
	) {}

	async run() {
		const users = await this.userRepo.find();
		if (!users.length) {
			this.logger.warn("No users available. Skipping notification seeding.");
			return;
		}

		let totalInserted = 0;
		for (const user of users) {
			const existing = await this.notificationRepo.count({
				where: { toUserId: user.id },
			});
			if (existing >= this.minPerUser) {
				continue;
			}

			const targetCount = faker.number.int({
				min: this.minPerUser,
				max: this.maxPerUser,
			});
			const toCreate = Math.max(targetCount - existing, 0);
			if (!toCreate) continue;

			const notifications = Array.from({ length: toCreate }, () => {
				const source = faker.helpers.arrayElement(this.sources);
				const template = this.buildNotificationContent(
					source,
					user.firstName ?? user.username,
				);
				return this.notificationRepo.create({
					toUserId: user.id,
					title: template.title,
					content: template.content,
					notificationSource: source,
					isRead: Math.random() < 0.35,
					createdAt: faker.date.recent({ days: 20 }),
				});
			});

			await this.notificationRepo.save(notifications);
			totalInserted += notifications.length;
		}

		if (!totalInserted) {
			this.logger.log(
				"Notifications already seeded for every user. Nothing to do.",
			);
			return;
		}

		this.logger.log(
			`Seeded ${totalInserted} notifications across ${users.length} users.`,
		);
	}

	private buildNotificationContent(source: string, name: string) {
		switch (source) {
			case "task":
				return {
					title: `${faker.hacker.verb()} task update`,
					content: `Reminder: ${faker.company.buzzVerb()} task \"${faker.hacker.noun()}\" assigned to ${name} needs attention.`,
				};
			case "friend-request":
				return {
					title: "New friend request",
					content: `${faker.person.fullName()} sent ${name} a friend request. Respond when ready!`,
				};
			case "mention":
				return {
					title: "You were mentioned",
					content: `${faker.person.firstName()} mentioned ${name} in #${faker.hacker.noun()} and wants your feedback.`,
				};
			case "code-collaboration":
				return {
					title: "Code collaboration invite",
					content: `${faker.person.firstName()} invited ${name} to review a ${faker.helpers.arrayElement(["TypeScript", "Python", "Go"])} snippet.`,
				};
			default:
				return {
					title: "System notification",
					content: `System update: ${faker.hacker.phrase()} for ${name}.`,
				};
		}
	}
}
