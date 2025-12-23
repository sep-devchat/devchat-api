import { faker } from "@faker-js/faker";
import {
	ChannelRepository,
	GroupInvitationRepository,
	GroupRepository,
	GroupSubscriptionRepository,
	GroupSupportedProgrammingLanguageRepository,
	SupportedProgrammingLanguageRepository,
	SubscriptionRepository,
	UserGroupRepository,
	UserRepository,
} from "@db/repositories";
import { Injectable } from "@nestjs/common";
import { Env } from "@utils";
import * as fs from "fs";
import * as path from "path";
import {
	GroupEntity,
	GroupInvitationEntity,
	GroupSubscriptionEntity,
	SupportedProgrammingLanguageEntity,
	UserEntity,
	UserGroupEntity,
} from "@db/entities";
import { FindOptionsWhere, In, Not } from "typeorm";

@Injectable()
export class GroupSeederService {
	private readonly GROUP_CHANNELS = ["general", "code", "design"] as const;
	private readonly DEFAULT_GROUP_DESCRIPTION =
		"Collaborative space seeded for testing";
	private readonly TOTAL_GROUPS = 20;
	private readonly OWN_GROUP_BY_IMPORTANT_USERS = 3;
	private readonly GROUP_MEMBER_RANGE: [number, number] = [3, 5];
	private readonly LANGUAGE_PER_GROUP = 1;
	private readonly MAX_INVITES_PER_GROUP = 3;
	private readonly FREE_PLAN_CODE = "FREE_00";
	private readonly importantEmails = this.loadImportantEmails();

	constructor(
		private readonly userRepo: UserRepository,
		private readonly groupRepo: GroupRepository,
		private readonly userGroupRepo: UserGroupRepository,
		private readonly groupInvitationRepo: GroupInvitationRepository,
		private readonly channelRepo: ChannelRepository,
		private readonly programmingLanguageRepo: SupportedProgrammingLanguageRepository,
		private readonly groupSupportedLanguageRepo: GroupSupportedProgrammingLanguageRepository,
		private readonly subscriptionRepo: SubscriptionRepository,
		private readonly groupSubscriptionRepo: GroupSubscriptionRepository,
	) {}

	private async ensureFreeSubscriptionId(): Promise<string | null> {
		const existing = await this.subscriptionRepo.findOne({
			where: { subscriptionCode: this.FREE_PLAN_CODE },
			select: ["id"],
		});
		if (existing?.id) {
			return existing.id;
		}

		// Create the FREE_00 subscription if it doesn't exist yet.
		// Mirrors the defaults from src/modules/subscription/subscription.startup-seeder.ts.
		const created = await this.subscriptionRepo.save(
			this.subscriptionRepo.create({
				subscriptionCode: this.FREE_PLAN_CODE,
				subscriptionName: "Free Plan",
				price: 0,
				limitMembers: 5,
				isAIActive: false,
				runCodePerDay: 50,
				programmingLanguageInGroups: 1,
				levelSubscription: 0,
			}),
		);
		return created?.id ?? null;
	}

	private async assignFreePlan(groups: GroupEntity[]): Promise<number> {
		if (!groups.length) return 0;
		const freeSubscriptionId = await this.ensureFreeSubscriptionId();
		if (!freeSubscriptionId) return 0;

		const startedAt = new Date();
		const records: GroupSubscriptionEntity[] = groups.map((group) =>
			this.groupSubscriptionRepo.create({
				groupId: group.id,
				subscriptionId: freeSubscriptionId,
				groupSubscriptionStatus: "active",
				monthQuantity: 1,
				paymentBy: null,
				isPaid: false,
				startedAt,
				endedAt: null,
			}),
		);

		await this.groupSubscriptionRepo.save(records);
		return records.length;
	}

	private async createGroups(
		users: UserEntity[],
		count: number,
		ownerQueue: string[] = [],
	): Promise<GroupEntity[]> {
		const entities = Array.from({ length: count }).map(() => {
			const ownerId = ownerQueue.length
				? ownerQueue.shift()!
				: faker.helpers.arrayElement(users).id;
			const owner =
				users.find((user) => user.id === ownerId) ??
				faker.helpers.arrayElement(users);
			return this.groupRepo.create({
				name: faker.company.name().slice(0, 200),
				description: this.DEFAULT_GROUP_DESCRIPTION,
				avatar: faker.image.avatar(),
				createdBy: owner.id,
				isActive: true,
			});
		});
		return this.groupRepo.save(entities);
	}

	private async assignMembers(
		users: UserEntity[],
		groups: GroupEntity[],
	): Promise<{
		membershipCount: number;
		inviteCount: number;
		memberIds: Set<string>;
	}> {
		const memberships: UserGroupEntity[] = [];
		const invitations: GroupInvitationEntity[] = [];
		const memberIds = new Set<string>();

		for (const group of groups) {
			const owner = users.find((user) => user.id === group.createdBy);
			if (!owner) continue;

			memberships.push(
				this.userGroupRepo.create({
					groupId: group.id,
					userId: owner.id,
					addedById: owner.id,
					invitedAt: faker.date.recent({ days: 10 }),
					joinedAt: faker.date.recent({ days: 5 }),
				}),
			);
			memberIds.add(owner.id);

			const otherUsers = users.filter((user) => user.id !== owner.id);
			if (!otherUsers.length) {
				continue;
			}

			const maxBound = Math.min(this.GROUP_MEMBER_RANGE[1], otherUsers.length);
			const minBound = Math.min(this.GROUP_MEMBER_RANGE[0], maxBound);
			const memberCount =
				maxBound === 0
					? 0
					: faker.number.int({
							min: minBound,
							max: maxBound,
						});
			const shuffled = faker.helpers.shuffle(otherUsers);
			const memberPool = shuffled.slice(0, memberCount);
			const groupMemberIds = new Set(memberPool.map((member) => member.id));

			for (const member of memberPool) {
				memberships.push(
					this.userGroupRepo.create({
						groupId: group.id,
						userId: member.id,
						addedById: owner.id,
						invitedAt: faker.date.recent({ days: 15 }),
						joinedAt:
							faker.helpers.maybe(() => faker.date.recent({ days: 7 }), {
								probability: 0.7,
							}) ?? null,
					}),
				);
				memberIds.add(member.id);
			}

			const inviteCandidates = shuffled.filter(
				(candidate) => !groupMemberIds.has(candidate.id),
			);
			if (!inviteCandidates.length) {
				continue;
			}

			const inviteCount = faker.number.int({
				min: 0,
				max: Math.min(this.MAX_INVITES_PER_GROUP, inviteCandidates.length),
			});
			const selectedInvites = inviteCandidates.slice(0, inviteCount);
			for (const invitee of selectedInvites) {
				invitations.push(
					this.groupInvitationRepo.create({
						groupId: group.id,
						fromUserId: owner.id,
						toUserId: invitee.id,
						message: faker.lorem.sentence(),
						createdBy: owner.id,
					}),
				);
			}
		}

		if (memberships.length) {
			await this.userGroupRepo.save(memberships);
		}
		if (invitations.length) {
			await this.groupInvitationRepo.save(invitations);
		}

		return {
			membershipCount: memberships.length,
			inviteCount: invitations.length,
			memberIds,
		};
	}

	private async assignLanguages(
		groups: GroupEntity[],
		languages: SupportedProgrammingLanguageEntity[],
	): Promise<number> {
		if (!languages.length) {
			return 0;
		}

		const perGroup = Math.min(
			Math.max(this.LANGUAGE_PER_GROUP, 1),
			languages.length,
		);
		const records = groups.flatMap((group) => {
			const selected = faker.helpers.arrayElements(languages, perGroup);
			return selected.map((language) =>
				this.groupSupportedLanguageRepo.create({
					groupId: group.id,
					supportedProgrammingLanguageId: language.id,
					isActive: true,
				}),
			);
		});

		if (records.length) {
			await this.groupSupportedLanguageRepo.save(records);
		}

		return records.length;
	}

	private async createChannels(groups: GroupEntity[]): Promise<number> {
		const entities = groups.flatMap((group) =>
			this.GROUP_CHANNELS.map((name) =>
				this.channelRepo.create({
					name,
					groupId: group.id,
					description: `${name} channel for ${group.name}`.slice(0, 255),
					createdBy: group.createdBy,
				}),
			),
		);

		if (entities.length) {
			await this.channelRepo.save(entities);
		}

		return entities.length;
	}

	private async ensureImportantUsersInGroups(
		groups: GroupEntity[],
		importantUsers: UserEntity[],
		memberIds: Set<string>,
	): Promise<number> {
		if (!importantUsers.length || !groups.length) {
			return 0;
		}

		const missingUsers = importantUsers.filter(
			(user) => !memberIds.has(user.id),
		);
		if (!missingUsers.length) {
			return 0;
		}

		const additionalMemberships = missingUsers.map((user) => {
			const targetGroup = faker.helpers.arrayElement(groups);
			memberIds.add(user.id);
			return this.userGroupRepo.create({
				groupId: targetGroup.id,
				userId: user.id,
				addedById: targetGroup.createdBy,
				invitedAt: new Date(),
				joinedAt: new Date(),
			});
		});

		await this.userGroupRepo.save(additionalMemberships);
		return additionalMemberships.length;
	}

	async run() {
		const users = await this.userRepo.find({
			where: this.buildUserFilter(),
		});
		if (users.length === 0) {
			console.warn("No non-bot users available for group seeding.");
			return;
		}
		const importantUsers = users.filter((user) =>
			this.isImportantEmail(user.email),
		);

		const targetGroups = Math.max(0, this.TOTAL_GROUPS);
		const existingGroups = await this.groupRepo.count();

		const importantUserIds = importantUsers.map((user) => user.id);
		const ownershipCounts = new Map<string, number>();
		if (importantUserIds.length) {
			const existingImportantGroups = await this.groupRepo.find({
				where: { createdBy: In(importantUserIds) },
				select: ["id", "createdBy"],
			});
			existingImportantGroups.forEach((group) => {
				ownershipCounts.set(
					group.createdBy,
					(ownershipCounts.get(group.createdBy) ?? 0) + 1,
				);
			});
		}

		const ownerQueue: string[] = [];
		for (const user of importantUsers) {
			const current = ownershipCounts.get(user.id) ?? 0;
			const deficit = Math.max(this.OWN_GROUP_BY_IMPORTANT_USERS - current, 0);
			for (let index = 0; index < deficit; index += 1) {
				ownerQueue.push(user.id);
			}
		}

		const baseGroupsToCreate = Math.max(targetGroups - existingGroups, 0);
		const totalGroupsToCreate = Math.max(baseGroupsToCreate, ownerQueue.length);
		if (totalGroupsToCreate <= 0) {
			console.log(
				`Skipping group seeding; ${existingGroups} groups already exist (target ${targetGroups}).`,
			);
			return;
		}

		const allLanguages = await this.programmingLanguageRepo.find({
			where: { isActive: true },
		});
		if (!allLanguages.length) {
			console.warn("No programming languages found; skipping group seeding.");
			return;
		}

		const groups = await this.createGroups(
			users,
			totalGroupsToCreate,
			ownerQueue,
		);
		const groupSubscriptionCount = await this.assignFreePlan(groups);
		const { membershipCount, inviteCount, memberIds } =
			await this.assignMembers(users, groups);
		const ensuredMemberships = await this.ensureImportantUsersInGroups(
			groups,
			importantUsers,
			memberIds,
		);
		const languageCount = await this.assignLanguages(groups, allLanguages);
		const channelCount = await this.createChannels(groups);
		const totalMemberships = membershipCount + ensuredMemberships;
		console.log(
			`Seeded ${groups.length} groups, ${groupSubscriptionCount} group subscriptions, ${totalMemberships} memberships, ${inviteCount} invitations, ${languageCount} language associations, and ${channelCount} channels.`,
		);
	}

	private loadImportantEmails(): Set<string> {
		const filePath = path.join(
			__dirname,
			"../raw-data/important-accounts.json",
		);
		try {
			const raw = fs.readFileSync(filePath, "utf-8");
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) {
				return new Set(
					parsed
						.map((email) =>
							typeof email === "string" ? email.trim().toLowerCase() : null,
						)
						.filter((email): email is string => Boolean(email)),
				);
			}
		} catch (error) {
			console.warn("Unable to load important accounts list:", error);
		}
		return new Set();
	}

	private isImportantEmail(email?: string | null) {
		return email ? this.importantEmails.has(email.toLowerCase()) : false;
	}

	private buildUserFilter(): FindOptionsWhere<UserEntity> {
		if (Env.EMAIL_USER) {
			return { isBot: false, email: Not(Env.EMAIL_USER) };
		}
		return { isBot: false };
	}
}
