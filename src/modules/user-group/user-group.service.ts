import { Injectable, Logger } from "@nestjs/common";
import {
	DeleteMemberRequest,
	UpdateUserGroupRequest,
	UserGroupQuery,
} from "./dto";
import {
	UserGroupRepository,
	UserRepository,
	GroupInvitationRepository,
} from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls, InvitationStatus, PaginationDto } from "@utils";
import { GroupService } from "@modules/group";
import { UserService } from "@modules/user/user.service";
import { MemberNotFoundError } from "./errors";
import { FindOptionsWhere } from "typeorm";
import { UserEntity, UserGroupEntity } from "@db/entities";

/**
 * UserGroupService - Manages actual group membership records
 *
 * ARCHITECTURE OVERVIEW:
 * =====================
 * This service is part of a two-service architecture for group management:
 *
 * 1. GroupInvitationService - Handles invitation flow
 *    - Creates invitations (GroupInvitationEntity)
 *    - Manages invitation status (PENDING, ACCEPTED, DECLINED, CANCELLED)
 *    - Handles invitation acceptance/decline logic
 *    - Automatically creates UserGroupEntity when invitation is accepted
 *
 * 2. UserGroupService (this service) - Handles actual membership
 *    - Manages UserGroupEntity records (actual group memberships)
 *    - Handles direct member addition (admin actions)
 *    - Manages member removal
 *    - Provides membership queries and statistics
 *
 * WORKFLOW:
 * =========
 * Invitation Flow:
 * 1. User A invites User B → GroupInvitationService.createOne()
 * 2. User B accepts invite → GroupInvitationService.acceptInvitation()
 * 3. Acceptance automatically calls addUserToGroup() → UserGroupEntity created
 *
 * Direct Addition:
 * 1. Admin adds user directly → UserGroupService.addUserToGroup()
 * 2. UserGroupEntity created immediately (no invitation needed)
 *
 * ENTITIES:
 * =========
 * - GroupInvitationEntity: Tracks invitation lifecycle
 * - UserGroupEntity: Tracks actual group membership with status
 */
@Injectable()
export class UserGroupService {
	private readonly logger = new Logger(UserGroupService.name);

	constructor(
		private readonly userGroupRepo: UserGroupRepository,
		private readonly groupService: GroupService,
		private readonly userService: UserService,
		private readonly cls: ClsService<DevChatCls>,
		private userRepo: UserRepository,
		private readonly groupInvitationRepo: GroupInvitationRepository,
	) {}

	async getGroupMembers() {
		const groupId = this.cls.get("group").id;
		this.logger.log(`Getting members for group: ${groupId}`);

		const members = await this.userRepo.find({
			where: {
				userGroups: {
					groupId: groupId,
					status: InvitationStatus.ACCEPTED,
				},
			},
		});

		this.logger.log(`Found ${members.length} members in group ${groupId}`);
		return members;
	}

	async updateOne(id: string | number, dto: UpdateUserGroupRequest) {
		// TODO: Implement member role/permission updates
		this.logger.log(`Updating user-group record: ${id}`);
	}

	async findMany() {
		const groupId = this.cls.get("group").id;
		this.logger.log(`Finding all user-group records for group: ${groupId}`);

		return this.userGroupRepo.find({
			where: {
				groupId: groupId,
			},
			relations: {
				user: true,
			},
		});
	}

	async findOne(id: string) {
		const userGroup = await this.userGroupRepo.findOne({
			where: { id },
			relations: ["user", "addedBy", "group"],
		});

		return userGroup;
	}

	async deleteOne(id: string) {
		const userGroup = await this.findOne(id);
		return this.userGroupRepo.remove(userGroup);
	}

	// Get specific member by groupId and userId
	async getMemberByGroupAndUser(groupId: string, userId: string) {
		const groupUser = await this.userGroupRepo.findOne({
			where: {
				group: { id: groupId },
				user: { id: userId },
			},
			relations: ["user", "addedBy", "group"],
		});

		if (!groupUser) {
			throw new MemberNotFoundError();
		}

		return groupUser;
	}

	// Remove member of a group
	async removeMemberByGroupAndUser(request: DeleteMemberRequest) {
		const groupId = this.cls.get("group").id;
		const { userId } = request;

		this.logger.log(`Removing user ${userId} from group ${groupId}`);

		const member = await this.getMemberByGroupAndUser(groupId, userId);

		// Also clean up any pending invitations
		await this.groupInvitationRepo.delete({
			toUserId: userId,
			groupId: groupId,
		});

		const result = await this.userGroupRepo.remove(member);
		this.logger.log(
			`Successfully removed user ${userId} from group ${groupId}`,
		);

		return result;
	}

	// Get all groups for a user
	async getUserGroups(userId: string) {
		await this.userService.findById(userId); // Validate user exists

		return this.userGroupRepo.find({
			where: { user: { id: userId } },
			relations: ["group", "addedBy"],
		});
	}

	// Check if user is member of group
	async isMember(groupId: string, userId: string): Promise<boolean> {
		const member = await this.userGroupRepo.findOne({
			where: {
				group: { id: groupId },
				user: { id: userId },
			},
		});

		return !!member;
	}

	// Get member count of a group
	async getMemberCount(groupId: string): Promise<number> {
		const count = await this.userGroupRepo.count({
			where: {
				group: { id: groupId },
				status: InvitationStatus.ACCEPTED,
			},
		});
		this.logger.log(`Group ${groupId} has ${count} members`);
		return count;
	}

	// Add user to group (called when invitation is accepted)
	async addUserToGroup(userId: string, groupId: string, addedById: string) {
		this.logger.log(`Adding user ${userId} to group ${groupId}`);

		// Check if already a member
		const existing = await this.userGroupRepo.findOne({
			where: { userId, groupId },
		});

		if (existing) {
			if (existing.status === InvitationStatus.ACCEPTED) {
				this.logger.warn(
					`User ${userId} is already a member of group ${groupId}`,
				);
				return existing;
			}

			// Update existing record to accepted
			existing.status = InvitationStatus.ACCEPTED;
			existing.joinedAt = new Date();
			existing.addedById = addedById;
			return await this.userGroupRepo.save(existing);
		}

		// Create new membership record
		const userGroup = this.userGroupRepo.create({
			userId,
			groupId,
			addedById,
			status: InvitationStatus.ACCEPTED,
			joinedAt: new Date(),
			invitedAt: new Date(),
		});

		const result = await this.userGroupRepo.save(userGroup);
		this.logger.log(`Successfully added user ${userId} to group ${groupId}`);
		return result;
	}

	// Add multiple members directly (admin action)
	async addMembers(groupId: string, userIds: string[]) {
		const addedBy = this.cls.get("profile");
		this.logger.log(`Adding ${userIds.length} users to group ${groupId}`);

		const members = [];

		for (const userId of userIds) {
			const user = await this.userService.findById(userId);

			// Check if already member
			const exists = await this.isMember(groupId, userId);
			if (!exists) {
				const userGroup = this.userGroupRepo.create({
					userId,
					groupId,
					addedById: addedBy.id,
					status: InvitationStatus.ACCEPTED,
					joinedAt: new Date(),
					invitedAt: new Date(),
				});
				members.push(userGroup);
			}
		}

		const result = await this.userGroupRepo.save(members);
		this.logger.log(
			`Successfully added ${members.length} new members to group ${groupId}`,
		);
		return result;
	}
}
