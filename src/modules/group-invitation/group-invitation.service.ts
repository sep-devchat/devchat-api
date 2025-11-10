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
import {
	DevChatCls,
	PaginationDto,
	GroupInvitationStatus,
	InvitationStatus,
} from "@utils";
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
				status: InvitationStatus.ACCEPTED,
			},
		});

		if (membership) {
			throw new AlreadyGroupMemberError();
		}

		// Check if group invitation already exists (pending)
		const existingInvitation = await this.repo.findOne({
			where: {
				toUserId,
				groupId,
				status: GroupInvitationStatus.PENDING,
			},
		});

		if (existingInvitation) {
			throw new GroupInvitationAlreadyExistsError();
		}
	}

	async createOne(dto: CreateGroupInvitationDto) {
		const userId = this.cls.get("profile").id;

		this.logger.log(
			`Creating group invitation from ${userId} to ${dto.toUserId} for group ${dto.groupId}`,
		);

		await this.validateBeforeCreate(userId, dto.toUserId, dto.groupId);

		const groupInvitation = this.repo.create({
			fromUserId: userId,
			toUserId: dto.toUserId,
			groupId: dto.groupId,
			message: dto.message,
			status: GroupInvitationStatus.PENDING,
			createdBy: userId,
		});

		await this.repo.insert(groupInvitation);

		this.logger.log(
			`Group invitation created successfully with ID: ${groupInvitation.id}`,
		);

		// Return with relations
		return await this.repo.findOne({
			where: { id: groupInvitation.id },
			relations: ["fromUser", "toUser", "group"],
		});
	}

	async updateOne(id: string, dto: UpdateGroupInvitationRequest) {
		const existingInvitation = await this.findOne(id);
		const userId = this.cls.get("profile").id;

		this.logger.log(`Updating invitation ${id} to status: ${dto.status}`);

		// Only allow the recipient to update the status
		if (existingInvitation.toUserId !== userId) {
			this.logger.warn(
				`User ${userId} tried to update invitation ${id} but is not the recipient`,
			);
			throw new GroupInvitationNotFoundError();
		}

		// If accepting the invitation, add user to group
		if (dto.status === GroupInvitationStatus.ACCEPTED) {
			this.logger.log(
				`Adding user ${existingInvitation.toUserId} to group ${existingInvitation.groupId}`,
			);

			await this.addUserToGroup(
				existingInvitation.toUserId,
				existingInvitation.groupId,
				existingInvitation.fromUserId,
			);
		}

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

		// Check if user group record already exists and update it
		const existingUserGroup = await this.userGroupRepo.findOne({
			where: { userId, groupId },
		});

		if (existingUserGroup) {
			// Update existing record to accepted
			await this.userGroupRepo.update(existingUserGroup.id, {
				status: InvitationStatus.ACCEPTED,
				addedById: addedBy,
				joinedAt: new Date(),
			});
			this.logger.log(`Updated existing user-group record for user ${userId}`);
		} else {
			// Create new user group record
			const userGroup = this.userGroupRepo.create({
				userId,
				groupId,
				status: InvitationStatus.ACCEPTED,
				addedById: addedBy,
				joinedAt: new Date(),
				invitedAt: new Date(),
			});

			await this.userGroupRepo.save(userGroup);
			this.logger.log(`Created new user-group record for user ${userId}`);
		}
	}

	async findMany(query: GroupInvitationQuery) {
		const userId = this.cls.get("profile").id;
		const { page, limit, status, fromUserId, toUserId, groupId, search, type } =
			query;

		// Build where conditions based on type
		let where: FindOptionsWhere<GroupInvitationEntity>[] = [];

		if (type === "sent") {
			where = [{ fromUserId: userId }];
		} else if (type === "received") {
			where = [{ toUserId: userId }];
		} else {
			// type === "all"
			where = [{ fromUserId: userId }, { toUserId: userId }];
		}

		// Apply additional filters
		if (status !== undefined) {
			where = where.map((condition) => ({ ...condition, status }));
		}

		if (fromUserId) {
			where = where.map((condition) => ({ ...condition, fromUserId }));
		}

		if (toUserId) {
			where = where.map((condition) => ({ ...condition, toUserId }));
		}

		if (groupId) {
			where = where.map((condition) => ({ ...condition, groupId }));
		}

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

		// Only allow deletion of pending invitations
		if (existingInvitation.status !== GroupInvitationStatus.PENDING) {
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

		await this.repo.update(id, {
			status: GroupInvitationStatus.CANCELLED,
			updatedAt: new Date(),
		});

		return await this.repo.findOne({
			where: { id },
			relations: ["fromUser", "toUser", "group"],
		});
	}

	async removeUserFromGroup(userId: string, groupId: string) {
		this.logger.log(`Removing user ${userId} from group ${groupId}`);

		// Remove the user from group
		await this.userGroupRepo.delete({
			userId,
			groupId,
		});

		// Update any existing group invitation to CANCELLED status
		await this.repo.update(
			{
				toUserId: userId,
				groupId,
			},
			{
				status: GroupInvitationStatus.CANCELLED,
				updatedAt: new Date(),
			},
		);

		this.logger.log(
			`Successfully removed user ${userId} from group ${groupId}`,
		);

		return { message: "Successfully removed user from group" };
	}

	async getPendingInvitationsCount() {
		const userId = this.cls.get("profile").id;

		return await this.repo.count({
			where: {
				toUserId: userId,
				status: GroupInvitationStatus.PENDING,
			},
		});
	}

	async getInvitationsByGroup(groupId: string, query: GroupInvitationQuery) {
		const { page, limit, status } = query;

		// Build where conditions
		const where: FindOptionsWhere<GroupInvitationEntity> = {
			groupId,
		};

		// Apply status filter
		if (status !== undefined) {
			where.status = status;
		}

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

		// Only allow accepting pending invitations
		if (existingInvitation.status !== GroupInvitationStatus.PENDING) {
			this.logger.warn(
				`Invitation ${id} is not in pending status: ${existingInvitation.status}`,
			);
			throw new GroupInvitationNotFoundError();
		}

		return await this.updateOne(id, {
			status: GroupInvitationStatus.ACCEPTED,
		});
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

		// Only allow declining pending invitations
		if (existingInvitation.status !== GroupInvitationStatus.PENDING) {
			this.logger.warn(
				`Invitation ${id} is not in pending status: ${existingInvitation.status}`,
			);
			throw new GroupInvitationNotFoundError();
		}

		return await this.updateOne(id, {
			status: GroupInvitationStatus.DECLINED,
		});
	}
}
