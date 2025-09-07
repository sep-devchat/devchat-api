import { UserRepository } from "@db/repositories";
import { Injectable } from "@nestjs/common";
import {
	InvalidGoogleCredentialsError,
	UserExistedError,
	WrongUsernameOrPasswordError,
} from "./errors";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import {
	LoginGoogleRequest,
	LoginRequest,
	RegisterRequest,
	TokenResponse,
} from "./dto";
import { DevChatCls, Env } from "@utils";
import { ClsService } from "nestjs-cls";
import { OAuth2Client } from "google-auth-library";

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

		return await this.userRepo.insert(user);
	}

	issueTokenPair(userId: string): TokenResponse {
		const accessToken = jwt.sign({}, Env.JWT_SECRET, {
			subject: userId,
			expiresIn: Env.JWT_EXPIRES_IN,
			issuer: Env.JWT_ISSUER,
		});

		return {
			accessToken,
		};
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

		return this.issueTokenPair(user.id);
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

	async loginGoogle(dto: LoginGoogleRequest) {
		const client = new OAuth2Client();

		const ticket = await client.verifyIdToken({
			idToken: dto.credential,
			audience: Env.GOOGLE_CLIENT_ID,
		});
		const payload = ticket.getPayload();
		const email = payload.email;

		if (!email) throw new InvalidGoogleCredentialsError();

		let user = await this.userRepo.findOne({
			where: {
				email,
			},
		});

		if (!user) {
			const data = await this.register({
				email: email,
				username: email.split("@")[0],
				password: Math.random().toString(36).slice(-8),
				firstName: payload.given_name ?? "",
				lastName: payload.family_name ?? "",
				avatarUrl: payload.picture ?? null,
			});

			user = await this.userRepo.findOne({
				where: {
					id: data.identifiers[0].id,
				},
			});
		}

		return this.issueTokenPair(user.id);
	}
}
