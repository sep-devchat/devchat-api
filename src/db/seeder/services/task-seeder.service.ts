import { faker } from "@faker-js/faker";
import { GroupEntity, TaskEntity, UserEntity } from "@db/entities";
import {
	GroupRepository,
	TaskHistoryRepository,
	TaskRepository,
	UserGroupRepository,
	UserRepository,
} from "@db/repositories";
import { TaskPriorityEnum, TaskStatusEnum, Env } from "@utils";
import { Injectable } from "@nestjs/common";
import { FindOptionsWhere, Not } from "typeorm";

type GroupStub = Pick<GroupEntity, "id" | "createdBy">;
type UserStub = Pick<UserEntity, "id">;

@Injectable()
export class TaskSeederService {
	private readonly TASKS_PER_GROUP = 20;
	private readonly TASK_HISTORIES_PER_TASK = 5;
	private readonly TASK_PER_USER_PER_GROUP_RANGE: [number, number] = [1, 5];

	constructor(
		private readonly groupRepo: GroupRepository,
		private readonly userRepo: UserRepository,
		private readonly userGroupRepo: UserGroupRepository,
		private readonly taskRepo: TaskRepository,
		private readonly taskHistoryRepo: TaskHistoryRepository,
	) {}

	async run() {
		const [groups, users, memberships] = await Promise.all([
			this.groupRepo.find({ select: ["id", "createdBy"] }),
			this.userRepo.find({
				where: this.buildUserFilter(),
				select: ["id"],
			}),
			this.userGroupRepo.find({ select: ["groupId", "userId"] }),
		]);

		if (!groups.length) {
			console.warn("No groups available; skipping task seeding.");
			return;
		}

		if (!users.length) {
			console.warn("No eligible users found; skipping task seeding.");
			return;
		}

		if (!memberships.length) {
			console.warn("No user memberships found; skipping task seeding.");
			return;
		}

		const membersByGroup = this.buildMembersByGroup(memberships);
		const userIds = users.map((user) => user.id);
		const tasksToInsert: TaskEntity[] = [];
		const touchedGroups = new Set<string>();

		for (const group of groups) {
			const remainingSlots = await this.calculateRemainingSlots(group.id);
			if (!remainingSlots) {
				continue;
			}
			const members = membersByGroup.get(group.id) ?? [];
			if (!members.length) {
				console.warn(
					`Skipping group ${group.id}; no members available for task assignments.`,
				);
				continue;
			}

			const groupTasks = this.buildTasksForGroup(
				group,
				members,
				users,
				remainingSlots,
			);
			if (!groupTasks.length) {
				continue;
			}

			tasksToInsert.push(...groupTasks);
			touchedGroups.add(group.id);
		}

		if (!tasksToInsert.length) {
			console.log("All groups already meet the target number of tasks.");
			return;
		}

		const savedTasks = await this.taskRepo.save(tasksToInsert);
		const histories = this.buildTaskHistories(
			savedTasks,
			membersByGroup,
			userIds,
		);
		if (histories.length) {
			await this.taskHistoryRepo.save(histories);
		}

		console.log(
			`Seeded ${savedTasks.length} tasks across ${touchedGroups.size} groups with ${histories.length} task history entries.`,
		);
	}

	private buildMembersByGroup(records: { groupId: string; userId: string }[]) {
		const map = new Map<string, string[]>();
		for (const record of records) {
			const members = map.get(record.groupId) ?? [];
			members.push(record.userId);
			map.set(record.groupId, members);
		}
		return map;
	}

	private async calculateRemainingSlots(groupId: string) {
		const existingCount = await this.taskRepo.count({ where: { groupId } });
		return Math.max(this.TASKS_PER_GROUP - existingCount, 0);
	}

	private buildTasksForGroup(
		group: GroupStub,
		members: string[],
		users: UserStub[],
		remainingSlots: number,
	) {
		const tasks: TaskEntity[] = [];
		const [minPerUser, maxPerUser] = this.TASK_PER_USER_PER_GROUP_RANGE;
		const shuffledMembers = faker.helpers.shuffle(members);

		for (const memberId of shuffledMembers) {
			if (tasks.length >= remainingSlots) {
				break;
			}
			const desired = faker.number.int({ min: minPerUser, max: maxPerUser });
			const available = remainingSlots - tasks.length;
			const actual = Math.min(desired, available);
			for (let index = 0; index < actual; index += 1) {
				tasks.push(this.buildTask(group, memberId, members, users));
			}
		}

		while (tasks.length < remainingSlots) {
			const assigneeId = faker.helpers.maybe(
				() => faker.helpers.arrayElement(members),
				{ probability: members.length ? 0.6 : 0 },
			);
			tasks.push(this.buildTask(group, assigneeId ?? null, members, users));
		}

		return tasks;
	}

	private buildTask(
		group: GroupStub,
		assigneeId: string | null,
		members: string[],
		users: UserStub[],
	) {
		const creatorId = this.pickCreator(group, members, users);
		const status = this.randomStatus();
		const priority = this.randomPriority();
		const { startDate, dueDate } = this.buildSchedule();

		return this.taskRepo.create({
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
		});
	}

	private pickCreator(group: GroupStub, members: string[], users: UserStub[]) {
		const memberSet = new Set(members);
		if (
			group.createdBy &&
			memberSet.has(group.createdBy) &&
			Math.random() < 0.7
		) {
			return group.createdBy;
		}
		const pool = members.length ? members : users.map((user) => user.id);
		return faker.helpers.arrayElement(pool);
	}

	private randomStatus() {
		const roll = Math.random();
		if (roll < 0.55) return TaskStatusEnum.TODO;
		if (roll < 0.85) return TaskStatusEnum.IN_PROGRESS;
		return TaskStatusEnum.DONE;
	}

	private randomPriority() {
		const roll = Math.random();
		if (roll < 0.2) return TaskPriorityEnum.LOW;
		if (roll < 0.75) return TaskPriorityEnum.MEDIUM;
		return TaskPriorityEnum.HIGH;
	}

	private buildSchedule() {
		const startDate =
			faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
				probability: 0.7,
			}) ?? null;

		if (!startDate) {
			return { startDate: null, dueDate: null };
		}

		const dueDate =
			faker.helpers.maybe(
				() =>
					faker.date.soon({
						days: faker.number.int({ min: 2, max: 21 }),
						refDate: startDate,
					}),
				{ probability: 0.8 },
			) ?? null;

		return { startDate, dueDate };
	}

	private buildTaskTitle() {
		return `${faker.hacker.verb()} ${faker.commerce.productAdjective()} ${faker.hacker.noun()}`.slice(
			0,
			255,
		);
	}

	private buildTaskHistories(
		tasks: TaskEntity[],
		membersByGroup: Map<string, string[]>,
		allUserIds: string[],
	) {
		const histories = [];
		for (const task of tasks) {
			const actors = membersByGroup.get(task.groupId);
			const actorPool = actors?.length ? actors : allUserIds;
			const events = this.buildHistoryEvents(task);
			const limitedEvents = events.slice(0, this.TASK_HISTORIES_PER_TASK);
			for (const event of limitedEvents) {
				histories.push(
					this.taskHistoryRepo.create({
						taskId: task.id,
						userId: faker.helpers.arrayElement(actorPool),
						action: event.action,
						fieldName: event.fieldName,
						oldValue: event.oldValue,
						newValue: event.newValue,
						createdAt: faker.date.recent({ days: 45 }),
					}),
				);
			}
		}
		return histories;
	}

	private buildHistoryEvents(task: TaskEntity) {
		const events = [
			{
				action: "CREATED",
				fieldName: null,
				oldValue: null,
				newValue: "Task created",
			},
		];

		const timeline = this.buildStatusTimeline(task.status);
		for (let index = 1; index < timeline.length; index += 1) {
			events.push({
				action: "STATUS_UPDATED",
				fieldName: "status",
				oldValue: this.describeStatus(timeline[index - 1]),
				newValue: this.describeStatus(timeline[index]),
			});
		}

		events.push({
			action: "PRIORITY_SET",
			fieldName: "priority",
			oldValue: null,
			newValue: this.describePriority(task.priority),
		});

		while (events.length < this.TASK_HISTORIES_PER_TASK) {
			events.push({
				action: "COMMENTED",
				fieldName: null,
				oldValue: null,
				newValue: faker.hacker.phrase(),
			});
		}

		return events;
	}

	private buildStatusTimeline(finalStatus: number) {
		const order = [
			TaskStatusEnum.TODO,
			TaskStatusEnum.IN_PROGRESS,
			TaskStatusEnum.DONE,
		];
		const targetIndex = order.indexOf(finalStatus as TaskStatusEnum);
		if (targetIndex === -1) {
			return order;
		}
		return order.slice(0, targetIndex + 1);
	}

	private describeStatus(status: number) {
		return TaskStatusEnum[status as TaskStatusEnum] ?? `${status}`;
	}

	private describePriority(priority: number) {
		return TaskPriorityEnum[priority as TaskPriorityEnum] ?? `${priority}`;
	}

	private buildUserFilter(): FindOptionsWhere<UserEntity> {
		if (Env.EMAIL_USER) {
			return { isBot: false, email: Not(Env.EMAIL_USER) };
		}
		return { isBot: false };
	}
}
