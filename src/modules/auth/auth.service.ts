import { UserRepository } from "@db/repositories";
import { Injectable } from "@nestjs/common";
import {
	InvalidGoogleCredentialsError,
	UserExistedError,
	WrongUsernameOrPasswordError,
	RefreshTokenError,
	LoginMethodNotSupportedError,
	InvalidPkceAuthCodeError,
} from "./errors";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import {
	LoginRequest,
	RegisterRequest,
	TokenResponse,
	TokenRefreshRequest,
	LoginPkceRequest,
	LoginPkceResponse,
	PkceIssueTokenRequest,
} from "./dto";
import { DevChatCls, Env, LoginMethodEnum } from "@utils";
import { ClsService } from "nestjs-cls";
import { OAuth2Client } from "google-auth-library";
import { GitHubService } from "@providers/github";
import { UserEntity } from "@db/entities";

@Injectable()
export class AuthService {
	constructor(
		private readonly userRepo: UserRepository,
		private readonly cls: ClsService<DevChatCls>,
		private readonly githubService: GitHubService,
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

	issueTokenPair(userId: string): TokenResponse {
		return {
			accessToken: this.signAccessToken(userId),
			refreshToken: this.signRefreshToken(userId),
		};
	}

	async login(dto: LoginRequest) {
		let user: UserEntity;
		switch (dto.method) {
			case LoginMethodEnum.BASIC:
				user = await this.loginBasic(dto);
				break;
			case LoginMethodEnum.GOOGLE:
				user = await this.loginGoogle(dto);
				break;
			case LoginMethodEnum.GITHUB:
				user = await this.loginGitHub(dto);
				break;
			default:
				throw new LoginMethodNotSupportedError();
		}
		return this.issueTokenPair(user.id);
	}

	async loginPkce(dto: LoginPkceRequest): Promise<LoginPkceResponse> {
		let user: UserEntity;
		switch (dto.method) {
			case LoginMethodEnum.BASIC:
				user = await this.loginBasic(dto);
				break;
			case LoginMethodEnum.GOOGLE:
				user = await this.loginGoogle(dto);
				break;
			case LoginMethodEnum.GITHUB:
				user = await this.loginGitHub(dto);
				break;
			default:
				throw new LoginMethodNotSupportedError();
		}

		// support plain code_challenge_method only
		const authCode = jwt.sign(
			{
				codeChallengeMethod: dto.codeChallengeMethod,
			},
			Env.PKCE_AUTH_CODE_JWT_SECRET,
			{
				subject: user.id,
				expiresIn: Env.PKCE_AUTH_CODE_JWT_EXPIRES_IN,
				issuer: Env.JWT_ISSUER,
				audience: dto.codeChallenge,
			},
		);

		return { authCode };
	}

	async pkceIssueToken(dto: PkceIssueTokenRequest) {
		const decoded = jwt.verify(dto.authCode, Env.PKCE_AUTH_CODE_JWT_SECRET, {
			issuer: Env.JWT_ISSUER,
		});

		if (
			typeof decoded === "string" ||
			!decoded.sub ||
			!decoded.aud ||
			!decoded.codeChallengeMethod ||
			decoded["codeChallengeMethod"] != dto.codeChallengeMethod ||
			decoded.aud != dto.codeVerifier
		) {
			throw new InvalidPkceAuthCodeError();
		}

		return this.issueTokenPair(decoded.sub);
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

	refresh(dto: TokenRefreshRequest): TokenResponse {
		const decoded = jwt.verify(dto.refreshToken, Env.JWT_REFRESH_SECRET, {
			issuer: Env.JWT_ISSUER,
		});
		if (
			typeof decoded === "string" ||
			!decoded.sub ||
			(decoded as any).type !== "refresh"
		) {
			throw new RefreshTokenError();
		}
		const userId = decoded.sub as string;
		return this.issueTokenPair(userId);
	}

	getProfileCls() {
		return this.cls.get("profile");
	}

	async loginBasic(dto: LoginRequest) {
		const [usernameOrEmail, password] = Buffer.from(dto.code, "base64")
			.toString("utf-8")
			.split(":");

		const user = await this.userRepo.findOne({
			where: [
				{
					username: usernameOrEmail,
				},
				{
					email: usernameOrEmail,
				},
			],
		});

		if (!user) throw new WrongUsernameOrPasswordError();

		const isPassValid = bcrypt.compareSync(password, user.password);
		if (!isPassValid) throw new WrongUsernameOrPasswordError();

		return user;
	}

	async loginGoogle(dto: LoginRequest) {
		const client = new OAuth2Client();

		const ticket = await client.verifyIdToken({
			idToken: dto.code,
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
			const data = await this.userRepo.insert({
				email: email,
				username: email.split("@")[0],
				password: bcrypt.hashSync(Math.random().toString(36).slice(-8), 10),
				firstName: payload.given_name ?? "",
				lastName: payload.family_name ?? "",
				avatarUrl: payload.picture ?? null,
				emailVerified: payload.email_verified,
			});

			user = await this.userRepo.findOne({
				where: {
					id: data.identifiers[0].id,
				},
			});
		}

		return user;
	}

	async loginGitHub(dto: LoginRequest) {
		const { access_token } = await this.githubService.getAccessToken(dto.code);
		const [userInfoRes, emailsRes] = await Promise.all([
			this.githubService.getUserInfo(access_token),
			this.githubService.getUserEmails(access_token),
		]);

		const primaryEmailObj =
			emailsRes.find((emailObj) => emailObj.primary) || emailsRes[0];

		let user = await this.userRepo.findOne({
			where: {
				email: primaryEmailObj.email,
			},
		});

		if (!user) {
			const data = await this.userRepo.insert({
				email: primaryEmailObj.email,
				username: userInfoRes.login,
				password: bcrypt.hashSync(Math.random().toString(36).slice(-8), 10),
				firstName: userInfoRes.name ?? "",
				lastName: "",
				avatarUrl: userInfoRes.avatar_url ?? null,
				emailVerified: primaryEmailObj.verified,
			});

			user = await this.userRepo.findOne({
				where: {
					id: data.identifiers[0].id,
				},
			});
		}

		return user;
	}
}
