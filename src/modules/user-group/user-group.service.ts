import { Injectable, ForbiddenException } from "@nestjs/common";
import { DeleteMemberRequest, UpdateUserGroupRequest } from "./dto";
import {
	UserGroupRepository,
	UserRepository,
	GroupInvitationRepository,
} from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls } from "@utils";
import { GroupService } from "@modules/group";
import { UserService } from "@modules/user/user.service";
import { MemberNotFoundError } from "./errors";

@Injectable()
export class UserGroupService {
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
		const currentUserId = this.cls.get("profile").id;

		const members = await this.userRepo.find({
			where: {
				userGroups: {
					groupId: groupId,
				},
			},
		});

		return members;
	}

	async findMany() {
		const groupId = this.cls.get("group").id;
		const currentUserId = this.cls.get("profile").id;

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
		const currentUserId = this.cls.get("profile").id;
		const { userId } = request;

		// Fetch the group to check ownership
		const group = await this.groupService.findOne(groupId);

		// Verify that the current user is the group owner
		if (group.createdBy !== currentUserId) {
			throw new ForbiddenException(
				"Only the group owner can remove members from this group",
			);
		}

		const member = await this.getMemberByGroupAndUser(groupId, userId);

		// Also clean up any pending invitations
		await this.groupInvitationRepo.delete({
			toUserId: userId,
			groupId: groupId,
		});

		const result = await this.userGroupRepo.remove(member);

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
			},
		});
		return count;
	}

	// Add user to group (called when invitation is accepted)
	async addUserToGroup(userId: string, groupId: string, addedById: string) {
		// Check if already a member
		const existing = await this.userGroupRepo.findOne({
			where: { userId, groupId },
		});

		if (existing) {
			// if (existing.status === InvitationStatus.ACCEPTED) {
			// 	this.logger.warn(
			// 		`User ${userId} is already a member of group ${groupId}`,
			// 	);
			// 	return existing;
			// }

			// Update existing record
			existing.joinedAt = new Date();
			existing.addedById = addedById;
			return await this.userGroupRepo.save(existing);
		}

		// Create new membership record
		const userGroup = this.userGroupRepo.create({
			userId,
			groupId,
			addedById,
			joinedAt: new Date(),
			invitedAt: new Date(),
		});

		const result = await this.userGroupRepo.save(userGroup);
		return result;
	}

	// Add multiple members directly (admin action)
	async addMembers(groupId: string, userIds: string[]) {
		const addedBy = this.cls.get("profile");

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
					joinedAt: new Date(),
					invitedAt: new Date(),
				});
				members.push(userGroup);
			}
		}

		const result = await this.userGroupRepo.save(members);
		return result;
	}

	async leaveGroup(groupId: string) {
		const userId = this.cls.get("profile").id; // Get current user from CLS

		// Validate that the group exists
		await this.groupService.findOne(groupId);

		// Check if user is actually a member
		const member = await this.userGroupRepo.findOne({
			where: {
				groupId: groupId,
				userId: userId,
			},
			relations: ["user", "group"],
		});

		if (!member) {
			throw new MemberNotFoundError();
		}

		// Remove the membership
		const result = await this.userGroupRepo.remove(member);

		return result;
	}
}
