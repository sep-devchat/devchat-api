import { UserRepository } from "@db/repositories";
import { NotificationService } from "@modules/notification";
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { sendReminderEmailVerification } from "@utils";
import { LessThan } from "typeorm";

const MIN_ACCOUNT_AGE_DAYS = 1;
const REMINDER_INTERVAL_DAYS = 3;
const MAX_EXPIRED_DAYS = 30;

@Injectable()
export class UserScheduler {
	constructor(
		private readonly userRepo: UserRepository,
		private readonly notificationService: NotificationService,
	) {}

	// @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	// async remindUnverifiedUsers() {
	// 	const now = new Date();
	// 	const minCreatedAt = new Date(
	// 		now.getTime() - MIN_ACCOUNT_AGE_DAYS * 24 * 3600 * 1000,
	// 	);

	// 	const candidates = await this.userRepo.find({
	// 		where: {
	// 			emailVerified: false,
	// 			createdAt: LessThan(minCreatedAt),
	// 		},
	// 	});

	// 	for (const user of candidates) {
	// 		try {
	// 			const userAgeDays =
	// 				(now.getTime() - user.createdAt.getTime()) / (24 * 3600 * 1000);
	// 			if (
	// 				userAgeDays % REMINDER_INTERVAL_DAYS === 0 ||
	// 				MAX_EXPIRED_DAYS - userAgeDays < REMINDER_INTERVAL_DAYS
	// 			) {
	// 				// Send verification reminder email
	// 				sendReminderEmailVerification(
	// 					user.email,
	// 					user.firstName + " " + user.lastName,
	// 					Math.ceil(MAX_EXPIRED_DAYS - userAgeDays),
	// 				);

	// 				// Send notification in-app if needed
	// 				await this.notificationService.createOne({
	// 					toUserId: user.id,
	// 					title: "Email Verification Reminder",
	// 					content: `Please verify your email address. Your verification link will expire in ${Math.ceil(MAX_EXPIRED_DAYS - userAgeDays)} days.`,
	// 					notificationSource: "settings",
	// 				});
	// 			}
	// 		} catch (error) {
	// 			console.error(
	// 				`Failed to send verification reminder to user ${user.id}:`,
	// 				error,
	// 			);
	// 		}
	// 	}
	// }
}
