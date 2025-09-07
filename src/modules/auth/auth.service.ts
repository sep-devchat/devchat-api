import { UserRepository } from "@db/repositories";
import { Injectable } from "@nestjs/common";
import { UserExistedError, WrongUsernameOrPasswordError } from "./errors";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { LoginRequest, RegisterRequest, TokenResponse } from "./dto";
import { DevChatCls, Env } from "@utils";
import { ClsService } from "nestjs-cls";

@Injectable()
export class AuthService {
	constructor(
		private readonly userRepo: UserRepository,
		private readonly cls: ClsService<DevChatCls>,
	) {}

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

	async register(dto: RegisterRequest) {
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

		await this.userRepo.insert(user);
	}

	async login(dto: LoginRequest) {
		const user = await this.userRepo.findOne({
			where: [
				{
					username: dto.usernameOrEmail,
				},
				{
					email: dto.usernameOrEmail,
				},
			],
		});

		if (!user) throw new WrongUsernameOrPasswordError();

		const isPassValid = bcrypt.compareSync(dto.password, user.password);
		if (!isPassValid) throw new WrongUsernameOrPasswordError();

		const accessToken = jwt.sign({}, Env.JWT_SECRET, {
			subject: user.id,
			expiresIn: Env.JWT_EXPIRES_IN,
			issuer: Env.JWT_ISSUER,
		});

		const tokenResponse: TokenResponse = {
			accessToken,
		};

		return tokenResponse;
	}

	async getUserByAccessToken(token: string) {
		const decocded = jwt.verify(token, Env.JWT_SECRET, {
			issuer: Env.JWT_ISSUER,
		});
		if (typeof decocded === "string" || !decocded.sub) {
			return null;
		}
		const userId = decocded.sub;

		const user = await this.userRepo.findOne({
			where: {
				id: userId,
			},
		});

		return user;
	}

	getProfileCls() {
		return this.cls.get("profile");
	}
}
