import {
	UserFriendRepository,
	UserRepository,
	UserGroupRepository,
} from "@db/repositories";
import { Injectable } from "@nestjs/common";
import { UserExistedError } from "./errors/user-existed.error";
import * as bcrypt from "bcryptjs";
import {
	GetFriendRequestQuery,
	GroupRequestQuery,
	UpdateUserRequest,
	UserQuery,
	CreateUserRequest,
} from "./dto";
import { DevChatCls, PaginationDto } from "@utils";
import { UserNotFoundError } from "./errors";
import { randomBytes } from "crypto";
import { ClsService } from "nestjs-cls";

const emailToken = randomBytes(32).toString("hex");

@Injectable()
export class UserService {
	constructor(
		private readonly userRepo: UserRepository,
		private readonly userGroupRepo: UserGroupRepository,
		private readonly cls: ClsService<DevChatCls>,
		private readonly userFriendRepo: UserFriendRepository,
	) {}

	async validateBeforeCreate(dto: CreateUserRequest) {
		const user = await this.userRepo.findOne({
			where: [
				{
					username: dto.username,
				},
				{
					email: dto.email,
				},
			],
		});

		if (user) {
			throw new UserExistedError();
		}
	}

	async create(dto: CreateUserRequest, emailVerified = false) {
		await this.validateBeforeCreate(dto);

		const hashedPass = bcrypt.hashSync(dto.password, 10);
		const user = this.userRepo.create({
			username: dto.username,
			email: dto.email,
			password: hashedPass,
			firstName: dto.firstName ?? null,
			lastName: dto.lastName ?? null,
			avatarUrl: dto.avatarUrl ?? null,
			timezone: dto.timezone ?? null,
			emailVerified,
			emailVerificationToken: emailToken,
		});

		// await sendVerificationEmail(user.email, emailToken);

		return await this.userRepo.insert(user);
	}

	async findById(id: string) {
		const user = await this.userRepo.findOne({ where: { id } });
		if (!user) {
			throw new UserNotFoundError();
		}
		return user;
	}

	async findByUniqueKey(uniqueKey: string, throwIfNotFound = true) {
		const user = await this.userRepo.findOne({
			where: [{ id: uniqueKey }, { email: uniqueKey }, { username: uniqueKey }],
		});
		if (!user && throwIfNotFound) {
			throw new UserNotFoundError();
		}
		return user;
	}

	async findByEmailToken(token: string) {
		const user = await this.userRepo.findOne({
			where: { emailVerificationToken: token },
		});

		if (!user) {
			throw new UserNotFoundError();
		}
		return user;
	}

	async markEmailAsVerified(id: string) {
		const user = await this.findById(id);
		if (!user) {
			throw new UserNotFoundError();
		}
		await this.userRepo.update(id, {
			emailVerified: true,
			isActive: true,
		});
	}

	async getAll(query: UserQuery) {
		const { page, limit } = query;
		const [data, total] = await this.userRepo.findAndCount({
			skip: (page - 1) * limit,
			take: limit,
			order: { createdAt: "DESC" },
		});

		const pagination = new PaginationDto(page, limit, total);

		return {
			data,
			pagination,
		};
	}

	async update(id: string, updateData: UpdateUserRequest) {
		const user = await this.findByUniqueKey(id);

		if (!user) {
			throw new UserNotFoundError();
		}

		await this.userRepo.update(id, updateData);
	}

	async delete(id: string) {
		const user = await this.findByUniqueKey(id);
		user.isActive = false;
		await this.userRepo.save(user);
	}

	async getSentFriendRequests(query: GetFriendRequestQuery) {
		const userId = this.cls.get("profile").id;

		const { status } = query;
		const friendRequests = await this.userFriendRepo.find({
			where: {
				senderId: userId,
				status,
			},
			relations: ["sender", "receiver"],
		});

		return friendRequests;
	}

	async getReceivedFriendRequests(query: GetFriendRequestQuery) {
		const userId = this.cls.get("profile").id;

		const { status } = query;
		const friendRequests = await this.userFriendRepo.find({
			where: {
				receiverId: userId,
				status,
			},
			relations: ["sender", "receiver"],
		});

		return friendRequests;
	}

	async getReceiveGroupRequests(query: GroupRequestQuery) {
		const userId = this.cls.get("profile").id;
		const { status } = query;

		const groupRequests = this.userGroupRepo.find({
			where: {
				userId,
				status,
			},
			relations: ["user", "group", "addedBy"],
		});

		return groupRequests;
	}

	async getSentGroupRequests(query: GroupRequestQuery) {
		const userId = this.cls.get("profile").id;
		const { status } = query;

		const groupRequests = this.userGroupRepo.find({
			where: {
				addedById: userId,
				status,
			},
			relations: ["user", "group", "addedBy"],
		});

		return groupRequests;
	}
}
