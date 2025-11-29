import { TaskEntity, UserEntity } from "@db/entities";
import {
	GroupRepository,
	TaskRepository,
	UserGroupRepository,
	UserRepository,
} from "@db/repositories";
import { TaskPriorityEnum, TaskStatusEnum } from "@utils";
import { faker } from "@faker-js/faker";
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class TaskSeederService {
	private readonly logger = new Logger(TaskSeederService.name);
	private readonly minTasksPerGroup = 10;
	private readonly maxTasksPerGroup = 25;

	constructor(
		private readonly taskRepo: TaskRepository,
		private readonly userRepo: UserRepository,
		private readonly groupRepo: GroupRepository,
		private readonly userGroupRepo: UserGroupRepository,
	) {}

	async run() {
		const [groups, users, memberships] = await Promise.all([
			this.groupRepo.find(),
			this.userRepo.find(),
			this.userGroupRepo.find(),
		]);

		if (!groups.length) {
			this.logger.warn("No groups available. Skipping task seeding.");
			return;
		}

		if (!users.length) {
			this.logger.warn("No users available. Skipping task seeding.");
			return;
		}

		const membersByGroup = memberships.reduce<Map<string, string[]>>(
			(acc, membership) => {
				const next = acc.get(membership.groupId) ?? [];
				next.push(membership.userId);
				acc.set(membership.groupId, next);
				return acc;
			},
			new Map(),
		);

		const tasksToInsert: TaskEntity[] = [];
		const touchedGroupIds = new Set<string>();

		for (const group of groups) {
			const existingCount = await this.taskRepo.count({
				where: { groupId: group.id },
			});
			const targetCount = faker.number.int({
				min: this.minTasksPerGroup,
				max: this.maxTasksPerGroup,
			});
			const toCreate = Math.max(targetCount - existingCount, 0);
			if (!toCreate) continue;

			const groupMemberIds = membersByGroup.get(group.id) ?? [];

			for (let index = 0; index < toCreate; index += 1) {
				const creatorId = this.pickCreator(users, group.createdBy);
				const assigneeId = this.pickAssignee(groupMemberIds, users, creatorId);
				const status = this.randomStatus();
				const priority = this.randomPriority();
				const { startDate, dueDate } = this.buildSchedule();

				tasksToInsert.push(
					this.taskRepo.create({
						groupId: group.id,
						createdBy: creatorId,
						assigneeId,
						name: this.buildTaskTitle(),
						description: faker.lorem.sentences({ min: 1, max: 3 }),
						status,
						priority,
						startDate,
						dueDate,
						isActive: true,
					}),
				);
			}

			touchedGroupIds.add(group.id);
		}

		if (!tasksToInsert.length) {
			this.logger.log("Tasks already exist for every group. Nothing to seed.");
			return;
		}

		await this.taskRepo.save(tasksToInsert);
		this.logger.log(
			`Seeded ${tasksToInsert.length} tasks across ${touchedGroupIds.size} groups.`,
		);
	}

	private pickCreator(users: UserEntity[], ownerId: string) {
		const owner = users.find((user) => user.id === ownerId);
		if (owner && Math.random() < 0.6) {
			return owner.id;
		}
		return faker.helpers.arrayElement(users).id;
	}

	private pickAssignee(
		memberIds: string[],
		users: UserEntity[],
		creatorId: string,
	) {
		if (Math.random() < 0.25) {
			return null;
		}

		const pool = memberIds.length ? memberIds : users.map((user) => user.id);
		const filteredPool =
			pool.length > 1 ? pool.filter((id) => id !== creatorId) : pool;
		const candidatePool = filteredPool.length ? filteredPool : pool;
		return candidatePool.length
			? faker.helpers.arrayElement(candidatePool)
			: creatorId;
	}

	private randomStatus() {
		const roll = Math.random();
		if (roll < 0.55) return TaskStatusEnum.TODO;
		if (roll < 0.85) return TaskStatusEnum.IN_PROGRESS;
		return TaskStatusEnum.DONE;
	}

	private randomPriority() {
		const value = Math.random();
		if (value < 0.2) return TaskPriorityEnum.LOW;
		if (value < 0.75) return TaskPriorityEnum.MEDIUM;
		return TaskPriorityEnum.HIGH;
	}

	private buildSchedule() {
		const startDate =
			faker.helpers.maybe(() => faker.date.recent({ days: 20 }), {
				probability: 0.7,
			}) ?? null;

		if (!startDate) {
			return { startDate: null, dueDate: null };
		}

		const dueDate =
			faker.helpers.maybe(
				() =>
					faker.date.soon({
						days: faker.number.int({ min: 2, max: 14 }),
						refDate: startDate,
					}),
				{ probability: 0.8 },
			) ?? null;

		return { startDate, dueDate };
	}

	private buildTaskTitle() {
		return `${faker.hacker.verb()} ${faker.commerce.productAdjective()} ${faker.hacker.noun()}`;
	}
}
