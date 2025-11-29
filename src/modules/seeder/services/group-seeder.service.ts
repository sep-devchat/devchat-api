import {
	GroupEntity,
	GroupInvitationEntity,
	UserGroupEntity,
} from "@db/entities";
import {
	GroupInvitationRepository,
	GroupRepository,
	UserGroupRepository,
	UserRepository,
} from "@db/repositories";
import { Injectable, Logger } from "@nestjs/common";
import { faker } from "@faker-js/faker";

@Injectable()
export class GroupSeederService {
	private readonly logger = new Logger(GroupSeederService.name);
	private readonly maxGroupsPerUser = 4;
	private readonly maxMembersPerGroup = 5;
	private readonly maxInvitesPerGroup = 3;
	private readonly minGroupCount = 120;

	constructor(
		private readonly userRepo: UserRepository,
		private readonly groupRepo: GroupRepository,
		private readonly userGroupRepo: UserGroupRepository,
		private readonly groupInvitationRepo: GroupInvitationRepository,
	) {}

	async run() {
		const users = await this.userRepo.find();
		if (!users.length) {
			this.logger.warn("No users found. Skipping group seeding.");
			return;
		}

		const existingGroupCount = await this.groupRepo.count();
		if (existingGroupCount >= this.minGroupCount) {
			this.logger.log(
				`Existing group count (${existingGroupCount}) meets configured minimum (${this.minGroupCount}). Skipping group seeding.`,
			);
			return;
		}

		const groupsToCreate: GroupEntity[] = [];
		for (const user of users) {
			const groupsForUser = faker.number.int({
				min: 1,
				max: this.maxGroupsPerUser,
			});
			for (let index = 0; index < groupsForUser; index += 1) {
				groupsToCreate.push(
					this.groupRepo.create({
						name: faker.company.name(),
						avatar: faker.image.avatar(),
						isActive: true,
						createdBy: user.id,
						description: faker.company.catchPhrase(),
					}),
				);
			}
		}

		const savedGroups = await this.groupRepo.save(groupsToCreate);
		if (!savedGroups.length) {
			this.logger.warn("No groups were created.");
			return;
		}

		const userGroupEntities: UserGroupEntity[] = [];
		const invitationEntities: GroupInvitationEntity[] = [];

		for (const group of savedGroups) {
			const ownerMembership = this.userGroupRepo.create({
				groupId: group.id,
				userId: group.createdBy,
				addedById: group.createdBy,
				invitedAt: faker.date.recent({ days: 10 }),
				joinedAt: faker.date.recent({ days: 5 }),
			});
			userGroupEntities.push(ownerMembership);

			const otherUsers = users.filter((user) => user.id !== group.createdBy);
			if (!otherUsers.length) continue;

			const memberCount = faker.number.int({
				min: 0,
				max: Math.min(this.maxMembersPerGroup, otherUsers.length),
			});
			const shuffled = faker.helpers.shuffle(otherUsers);
			const memberPool = shuffled.slice(0, memberCount);
			const memberIds = new Set(memberPool.map((member) => member.id));

			for (const member of memberPool) {
				userGroupEntities.push(
					this.userGroupRepo.create({
						groupId: group.id,
						userId: member.id,
						addedById: group.createdBy,
						invitedAt: faker.date.recent({ days: 15 }),
						joinedAt: faker.datatype.boolean()
							? faker.date.recent({ days: 7 })
							: null,
					}),
				);
			}

			const inviteCandidates = shuffled.filter(
				(candidate) => !memberIds.has(candidate.id),
			);
			if (!inviteCandidates.length) continue;

			const inviteCount = faker.number.int({
				min: 0,
				max: Math.min(this.maxInvitesPerGroup, inviteCandidates.length),
			});
			const invitations = inviteCandidates.slice(0, inviteCount);
			for (const invitee of invitations) {
				invitationEntities.push(
					this.groupInvitationRepo.create({
						groupId: group.id,
						fromUserId: group.createdBy,
						toUserId: invitee.id,
						message: faker.lorem.sentence(),
						createdBy: group.createdBy,
					}),
				);
			}
		}

		if (userGroupEntities.length) {
			await this.userGroupRepo.save(userGroupEntities);
		}

		if (invitationEntities.length) {
			await this.groupInvitationRepo.save(invitationEntities);
		}

		this.logger.log(
			`Seeded ${savedGroups.length} groups with ${userGroupEntities.length} memberships and ${invitationEntities.length} invitations.`,
		);
	}
}
