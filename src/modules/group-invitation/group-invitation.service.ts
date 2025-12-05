import { Injectable, Logger } from "@nestjs/common";
import {
	CreateGroupInvitationDto,
	UpdateGroupInvitationRequest,
	GroupInvitationQuery,
} from "./dto";
import {
	GroupInvitationRepository,
	UserRepository,
	UserGroupRepository,
	GroupRepository,
} from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls, PaginationDto } from "@utils";
import { FindOptionsWhere, ILike } from "typeorm";
import { GroupInvitationEntity } from "@db/entities/group-invitation.entity";
import {
	GroupInvitationNotFoundError,
	GroupInvitationAlreadyExistsError,
	CannotInviteToSelfError,
	AlreadyGroupMemberError,
} from "./errors";
import { UserService } from "@modules/user";
import { GroupService } from "@modules/group";
import { NotificationService } from "@modules/notification";

@Injectable()
export class GroupInvitationService {
	private readonly logger = new Logger(GroupInvitationService.name);

	constructor(
		private readonly repo: GroupInvitationRepository,
		private readonly userRepo: UserRepository,
		private readonly groupRepo: GroupRepository,
		private readonly userGroupRepo: UserGroupRepository,
		private readonly userService: UserService,
		private readonly groupService: GroupService,
		private readonly cls: ClsService<DevChatCls>,
		private readonly notificationService: NotificationService,
	) {}

	async validateBeforeCreate(
		fromUserId: string,
		toUserId: string,
		groupId: string,
	) {
		// Cannot invite yourself
		if (fromUserId === toUserId) {
			throw new CannotInviteToSelfError();
		}

		// Check if target user exists
		await this.userService.findById(toUserId);

		// Check if group exists
		await this.groupService.findOne(groupId);

		// Check if user is already a member of the group
		const membership = await this.userGroupRepo.findOne({
			where: {
				userId: toUserId,
				groupId: groupId,
			},
		});

		if (membership) {
			throw new AlreadyGroupMemberError();
		}

		// Check if group invitation already exists
		const existingInvitation = await this.repo.findOne({
			where: {
				toUserId,
				groupId,
			},
		});

		if (existingInvitation) {
			throw new GroupInvitationAlreadyExistsError();
		}
	}

	async createOne(dto: CreateGroupInvitationDto) {
		const userId = this.cls.get("profile").id;

		const userToInvite = await this.userService.findByUniqueKey(
			dto.toUserIdOrEmail,
		);

		this.logger.log(
			`Creating group invitation from ${userId} to ${userToInvite.id} for group ${dto.groupId}`,
		);

		await this.validateBeforeCreate(userId, userToInvite.id, dto.groupId);

		const groupInvitation = this.repo.create({
			fromUserId: userId,
			toUserId: userToInvite.id,
			groupId: dto.groupId,
			message: dto.message,
			updatedAt: new Date(),
			createdBy: userId,
		});

		await this.repo.insert(groupInvitation);

		this.logger.log(
			`Group invitation created successfully with ID: ${groupInvitation.id}`,
		);

		await this.notificationService.createOne({
			toUserId: userToInvite.id,
			title: "New Group Invitation",
			content: `You have been invited to join a group`,
			notificationSource: `/chat/friend?tab=pending`,
		});

		// Return with relations
		return await this.repo.findOne({
			where: { id: groupInvitation.id },
			relations: ["fromUser", "toUser", "group"],
		});
	}

	async updateOne(id: string, dto: UpdateGroupInvitationRequest) {
		const existingInvitation = await this.findOne(id);
		const userId = this.cls.get("profile").id;

		// Only allow the sender or recipient to update
		if (
			existingInvitation.fromUserId !== userId &&
			existingInvitation.toUserId !== userId
		) {
			throw new GroupInvitationNotFoundError();
		}

		this.logger.log(`Updating invitation ${id} message`);

		await this.repo.update(id, {
			...dto,
			updatedAt: new Date(),
		});

		this.logger.log(`Successfully updated invitation ${id}`);

		// Return updated group invitation with relations
		return await this.repo.findOne({
			where: { id },
			relations: ["fromUser", "toUser", "group"],
		});
	}

	private async addUserToGroup(
		userId: string,
		groupId: string,
		addedBy: string,
	) {
		this.logger.log(`Adding user ${userId} to group ${groupId}`);

		// Create only one membership record
		const userGroup = this.userGroupRepo.create({
			userId,
			groupId,
			addedById: addedBy,
			joinedAt: new Date(),
			invitedAt: new Date(),
		});

		await this.userGroupRepo.save(userGroup);
		this.logger.log(`Created group membership record for user ${userId}`);
	}

	async findMany(query: GroupInvitationQuery) {
		const userId = this.cls.get("profile").id;
		const { page, limit, search } = query;

		// Build where conditions based on type
		let where: FindOptionsWhere<GroupInvitationEntity>[] = [];

		// type === "all"
		where = [{ fromUserId: userId }, { toUserId: userId }];

		const findOptions = {
			where,
			relations: ["fromUser", "toUser", "group"],
			skip: (page - 1) * limit,
			take: limit,
			order: { createdAt: "DESC" as const },
		};

		// Handle search separately if needed
		if (search) {
			const searchConditions = where.flatMap((condition) => [
				{
					...condition,
					fromUser: { username: ILike(`%${search}%`) },
				},
				{
					...condition,
					toUser: { username: ILike(`%${search}%`) },
				},
				{
					...condition,
					group: { name: ILike(`%${search}%`) },
				},
			]);

			const [data, total] = await this.repo.findAndCount({
				where: searchConditions,
				relations: findOptions.relations,
				skip: findOptions.skip,
				take: findOptions.take,
				order: findOptions.order,
			});

			const pagination = new PaginationDto(page, limit, total);
			return { data, pagination };
		}

		// Regular find without search
		const [data, total] = await this.repo.findAndCount(findOptions);

		const pagination = new PaginationDto(page, limit, total);

		return {
			data,
			pagination,
		};
	}

	async findOne(id: string) {
		const userId = this.cls.get("profile").id;

		const groupInvitation = await this.repo.findOne({
			where: [
				{ id, fromUserId: userId },
				{ id, toUserId: userId },
			],
			relations: ["fromUser", "toUser", "group"],
		});

		if (!groupInvitation) {
			throw new GroupInvitationNotFoundError();
		}

		return groupInvitation;
	}

	async deleteOne(id: string) {
		const existingInvitation = await this.findOne(id);
		const userId = this.cls.get("profile").id;

		// Only allow the sender to delete/cancel the invitation
		if (existingInvitation.fromUserId !== userId) {
			throw new GroupInvitationNotFoundError();
		}

		await this.repo.delete(id);

		return { message: "Group invitation deleted successfully" };
	}

	// Additional utility methods
	async cancelInvitation(id: string) {
		const existingInvitation = await this.findOne(id);
		const userId = this.cls.get("profile").id;

		// Only allow the sender to cancel
		if (existingInvitation.fromUserId !== userId) {
			throw new GroupInvitationNotFoundError();
		}

		this.logger.log(`Canceling group invitation ${id}`);
		await this.repo.delete(id);
		this.logger.log(`Group invitation ${id} cancelled successfully`);

		return { message: "Group invitation cancelled successfully" };
	}

	async removeUserFromGroup(userId: string, groupId: string) {
		this.logger.log(`Removing user ${userId} from group ${groupId}`);

		// Remove the user from group
		await this.userGroupRepo.delete({
			userId,
			groupId,
		});

		// Delete any existing group invitation
		await this.repo.delete({
			toUserId: userId,
			groupId,
		});

		this.logger.log(
			`Successfully removed user ${userId} from group ${groupId}`,
		);

		return { message: "Successfully removed user from group" };
	}

	async getInvitationsCount() {
		const userId = this.cls.get("profile").id;

		return await this.repo.count({
			where: {
				toUserId: userId,
			},
		});
	}

	async getInvitationsByGroup(groupId: string, query: GroupInvitationQuery) {
		const { page, limit } = query;

		// Build where conditions
		const where: FindOptionsWhere<GroupInvitationEntity> = {
			groupId,
		};

		const [data, total] = await this.repo.findAndCount({
			where,
			relations: ["fromUser", "toUser", "group"],
			skip: (page - 1) * limit,
			take: limit,
			order: { createdAt: "DESC" as const },
		});

		const pagination = new PaginationDto(page, limit, total);

		return {
			data,
			pagination,
		};
	}

	// Action-based methods for explicit status updates
	async acceptInvitation(id: string) {
		const existingInvitation = await this.findOne(id);
		const userId = this.cls.get("profile").id;

		this.logger.log(`User ${userId} accepting invitation ${id}`);

		// Only allow the recipient to accept
		if (existingInvitation.toUserId !== userId) {
			this.logger.warn(
				`User ${userId} tried to accept invitation ${id} but is not the recipient`,
			);
			throw new GroupInvitationNotFoundError();
		}

		try {
			// Add user to group
			await this.addUserToGroup(
				existingInvitation.toUserId,
				existingInvitation.groupId,
				existingInvitation.fromUserId,
			);

			// Delete the invitation record
			await this.repo.delete(id);

			await this.notificationService.createOne({
				toUserId: existingInvitation.fromUserId,
				title: "Group Invitation Accepted",
				content: `Your group invitation has been accepted`,
				notificationSource: `/chat/group/${existingInvitation.groupId}`,
			});

			this.logger.log(
				`Invitation ${id} accepted, membership created, and invitation deleted`,
			);
			return { message: "Group invitation accepted successfully" };
		} catch (error) {
			this.logger.error(
				`Failed to accept group invitation ${id}: ${error.message}`,
			);
			throw error;
		}
	}

	async declineInvitation(id: string) {
		const existingInvitation = await this.findOne(id);
		const userId = this.cls.get("profile").id;

		this.logger.log(`User ${userId} declining invitation ${id}`);

		// Only allow the recipient to decline
		if (existingInvitation.toUserId !== userId) {
			this.logger.warn(
				`User ${userId} tried to decline invitation ${id} but is not the recipient`,
			);
			throw new GroupInvitationNotFoundError();
		}

		// Simply delete the invitation record
		await this.repo.delete(id);

		this.logger.log(`Group invitation ${id} declined and deleted`);
		return { message: "Group invitation declined successfully" };
	}
}
