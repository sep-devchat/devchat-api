import { Injectable } from "@nestjs/common";
import {
	CreateInvitationRequest,
	DeleteMemberRequest,
	UpdateUserGroupRequest,
	UserGroupQuery,
} from "./dto";
import { UserGroupRepository } from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls, InvitationStatus, PaginationDto } from "@utils";
import { GroupService } from "@modules/group";
import { UserService } from "@modules/user/user.service";
import {
	InvalidInvitationError,
	InvitationNotFoundError,
	MemberAlreadyInvitedError,
	MemberExistedError,
	MemberNotFoundError,
} from "./errors";
import { FindOptionsWhere } from "typeorm";
import { UserEntity, UserGroupEntity } from "@db/entities";
import { UpdateInvitationRequest } from "./dto/update-invitation.request";

@Injectable()
export class UserGroupService {
	constructor(
		private readonly userGroupRepo: UserGroupRepository,
		private readonly groupService: GroupService,
		private readonly userService: UserService,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	async getGroupMembers(groupId: string, query: UserGroupQuery) {
		const { page, limit } = query;
		// Validate if group service exists
		await this.groupService.findOne(groupId);

		const [data, total] = await this.userGroupRepo.findAndCount({
			where: { group: { id: groupId }, status: InvitationStatus.ACCEPTED },
			relations: ["user", "addedBy", "group"],
		});

		const pagination = new PaginationDto(page, limit, total);

		const users: UserEntity[] = [];
		data.map((userGroup) => users.push(userGroup.user));

		return {
			users,
			pagination,
		};
	}
	async updateOne(id: string | number, dto: UpdateUserGroupRequest) {}

	async findMany(query: UserGroupQuery) {
		const { page = 1, limit = 10 } = query;

		const where: FindOptionsWhere<UserGroupEntity> = {};

		const [data, total] = await this.userGroupRepo.findAndCount({
			where,
			skip: (page - 1) * limit,
			take: limit,
			order: { joinedAt: "DESC" },
		});

		const pagination = new PaginationDto(page, limit, total);

		return {
			data,
			pagination,
		};
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
		const member = await this.getMemberByGroupAndUser(groupId, userId);
		return this.userGroupRepo.remove(member);
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
		return this.userGroupRepo.count({
			where: { group: { id: groupId } },
		});
	}

	// Add members
	async addMembers(groupId: string, userIds: string[]) {
		const group = await this.groupService.findOne(groupId);

		const addedBy = this.cls.get("profile");

		const members = [];

		for (const userId of userIds) {
			const user = await this.userService.findById(userId);

			// Check if already member
			const exists = await this.isMember(groupId, userId);
			if (!exists) {
				const userGroup = this.userGroupRepo.create({
					group,
					user,
					addedBy,
					joinedAt: new Date(),
				});
				members.push(userGroup);
			}
		}

		return this.userGroupRepo.insert(members);
	}
	// Invite user to a group
	async inviteUser(request: CreateInvitationRequest) {
		const { userId } = request;
		const invitedById = this.cls.get("profile").id;
		const groupId = this.cls.get("group").id;

		// Validate group and user exist
		const group = await this.groupService.findOne(groupId);
		const user = await this.userService.findById(userId);
		const addedBy = await this.userService.findById(invitedById);

		// Check if already invited/member
		const existing = await this.userGroupRepo.findOne({
			where: { group: { id: groupId }, user: { id: userId } },
		});

		if (existing) {
			if (existing.status === InvitationStatus.PENDING) {
				// Throw an user here
				throw new MemberAlreadyInvitedError();
			}
			if (existing.status === InvitationStatus.ACCEPTED) {
				// Throw an error here
				throw new MemberExistedError();
			}
			// Allow re-invite if previously declined
			if (existing.status === InvitationStatus.PENDING) {
				existing.status = InvitationStatus.ACCEPTED;
				existing.invitedAt = new Date();
				existing.addedBy = addedBy;
				return this.userGroupRepo.save(existing);
			}
		}

		const invitation = this.userGroupRepo.create({
			group,
			user,
			addedBy: addedBy,
			status: InvitationStatus.PENDING,
			invitedAt: new Date(),
			joinedAt: null,
		});

		return this.userGroupRepo.save(invitation);
	}

	// Update invitation status (accepted/declined)
	async updateInvitationStatus(request: UpdateInvitationRequest) {
		const { userId, status } = request;
		const groupId = this.cls.get("group").id;

		const invitation = await this.userGroupRepo.findOne({
			where: {
				group: { id: groupId },
				user: { id: userId },
				status: InvitationStatus.PENDING,
			},
			relations: ["user", "group", "addedBy"],
		});

		if (!invitation) {
			throw new InvitationNotFoundError();
		}

		if (
			![InvitationStatus.ACCEPTED, InvitationStatus.DECLINED].includes(status)
		) {
			throw new InvalidInvitationError();
		}

		// Update status
		invitation.status = status;

		if (status === InvitationStatus.ACCEPTED) {
			invitation.joinedAt = new Date();
		}

		const result = await this.userGroupRepo.save(invitation);
		return result;
	}
}
