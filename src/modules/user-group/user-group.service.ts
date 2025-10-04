import {
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import {
	CreateUserGroupRequest,
	UpdateUserGroupRequest,
	UserGroupQuery,
} from "./dto";
import { UserGroupRepository } from "@db/repositories";
import { ClsService } from "nestjs-cls";
import { DevChatCls, PaginationDto } from "@utils";
import { GroupService } from "@modules/group";
import { UserService } from "@modules/user/user.service";
import { MemberExistedError, MemberNotFoundError } from "./errors";
import { FindOptionsWhere } from "typeorm";
import { UserEntity, UserGroupEntity } from "@db/entities";
import { MemberResponse } from "./dto/member.response";

@Injectable()
export class UserGroupService {
	constructor(
		private readonly userGroupRepo: UserGroupRepository,
		private readonly groupService: GroupService,
		private readonly userService: UserService,
		private readonly cls: ClsService<DevChatCls>,
	) {}

	// Add member
	async createOne(groupId: string, userId: string) {
		const addedBy = this.cls.get("profile");

		// Validate group exists
		const group = await this.groupService.findOne(groupId);

		// Validate user exists
		const user = await this.userService.findById(userId);

		// Check if user is already in group
		const existingMember = await this.userGroupRepo.findOne({
			where: { group: { id: groupId }, user: { id: userId } },
		});

		if (existingMember) {
			// Throw an error that member already exist
			throw new MemberExistedError();
		}

		const userGroup = this.userGroupRepo.create({
			group: group,
			user: user,
			addedBy,
			joinedAt: new Date(),
		});

		await this.userGroupRepo.insert(userGroup);
		return userGroup;
	}

	async getGroupMembers(groupId: string, query: UserGroupQuery) {
		const { page, limit } = query;
		// Validate if group service exists
		await this.groupService.findOne(groupId);

		const [data, total] = await this.userGroupRepo.findAndCount({
			where: { group: { id: groupId } },
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
	async removeMemberByGroupAndUser(groupId: string, userId: string) {
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
}
