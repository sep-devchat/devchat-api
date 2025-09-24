import { UserEntity } from "@db/entities";
import { UserRepository } from "@db/repositories";
import { Injectable, NotFoundException } from "@nestjs/common"; // Add this import
import { RegisterRequest } from "./dto/register.request";
import { UserExistedError } from "./errors/user-existed.error";
import { TokenResponse } from "./dto/token.response";
import * as bcrypt from "bcryptjs";
import { Env, PaginationDto } from "@utils";
import * as jwt from "jsonwebtoken";

@Injectable() // Add this decorator
export class UserService {
	constructor(private readonly userRepo: UserRepository) {}

	async validateBeforeRegister(dto: RegisterRequest) {
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

	async register(dto: RegisterRequest): Promise<TokenResponse> {
		await this.validateBeforeRegister(dto);

		const hashedPass = bcrypt.hashSync(dto.password, 10);
		const user = this.userRepo.create({
			username: dto.username,
			email: dto.email,
			password: hashedPass,
			firstName: dto.firstName ?? null,
			lastName: dto.lastName ?? null,
			avatarUrl: dto.avatarUrl ?? null,
			timezone: dto.timezone ?? null,
		});

		const result = await this.userRepo.insert(user);
		return this.issueTokenPair(result.identifiers[0].id);
	}

	issueTokenPair(userId: string): TokenResponse {
		return {
			accessToken: this.signAccessToken(userId),
			refreshToken: this.signRefreshToken(userId),
		};
	}

	private signAccessToken(userId: string) {
		return jwt.sign({ type: "access" }, Env.JWT_SECRET, {
			subject: userId,
			expiresIn: Env.JWT_EXPIRES_IN,
			issuer: Env.JWT_ISSUER,
		});
	}

	private signRefreshToken(userId: string) {
		return jwt.sign({ type: "refresh" }, Env.JWT_REFRESH_SECRET, {
			subject: userId,
			expiresIn: Env.JWT_REFRESH_EXPIRES_IN,
			issuer: Env.JWT_ISSUER,
		});
	}

	async findById(id: string) {
		const user = await this.userRepo.findOne({ where: { id } });
		if (!user) {
			throw new NotFoundException(`User with ID ${id} not found`);
		}
		return user;
	}

	// Find by id OR username OR email
	async findByUniqueKey(uniqueKey: string) {
		const user = await this.userRepo.findOne({
			where: [{ id: uniqueKey }, { email: uniqueKey }, { username: uniqueKey }],
		});
		if (!user) {
			throw new NotFoundException(`User with key ${uniqueKey} not found`);
		}
		return user;
	}

	async getAll(page = 1, limit = 10) {
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

	async create(userData: Partial<UserEntity>) {
		const user = this.userRepo.create(userData);
		return this.userRepo.insert(user);
	}

	async update(id: string, updateData: Partial<UserEntity>) {
		const user = await this.findByUniqueKey(id);

		if (!user) {
			throw new UserExistedError();
		}

		await this.userRepo.update(id, updateData);
	}

	async delete(id: string) {
		return this.userRepo.delete(id);
	}
}
