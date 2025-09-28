import { UserRepository } from "@db/repositories";
import { Injectable } from "@nestjs/common";
import { UserExistedError } from "./errors/user-existed.error";
import * as bcrypt from "bcryptjs";
import { PaginationDto } from "@utils";
import { CreateUserRequest, UpdateUserRequest, UserQuery } from "./dto";
import { UserNotFoundError } from "./errors";

@Injectable()
export class UserService {
	constructor(private readonly userRepo: UserRepository) {}

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
		});

		return await this.userRepo.insert(user);
	}

	async findById(id: string) {
		const user = await this.userRepo.findOne({ where: { id } });
		if (!user) {
			throw new UserNotFoundError();
		}
		return user;
	}

	async findByUniqueKey(uniqueKey: string) {
		const user = await this.userRepo.findOne({
			where: [{ id: uniqueKey }, { email: uniqueKey }, { username: uniqueKey }],
		});
		if (!user) {
			throw new UserNotFoundError();
		}
		return user;
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
}
