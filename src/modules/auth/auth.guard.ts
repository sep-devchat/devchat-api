import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ClsService } from "nestjs-cls";
import { ADMIN_ROLE_KEY, DevChatCls } from "@utils";
import { Request } from "express";
import { InvalidTokenError } from "./errors";
import { Profile } from "./dto";
import { Reflector } from "@nestjs/core";
import { SKIP_AUTH_KEY } from "../../utils/skip-auth.decorator";
import { UserService } from "@modules/user";
import { UserRepository } from "@db/repositories";

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly authService: AuthService,
		private readonly userService: UserService,
		private readonly cls: ClsService<DevChatCls>,
		private readonly reflector: Reflector,
		private readonly userRepo: UserRepository,
	) {}

	async canActivate(context: ExecutionContext) {
		const skip =
			this.reflector.get(SKIP_AUTH_KEY, context.getClass()) ||
			this.reflector.get<boolean>(SKIP_AUTH_KEY, context.getHandler());
		if (skip) return true;

		const request = context.switchToHttp().getRequest<Request>();
		const token =
			this.getAccessTokenFromHeader(request) ||
			this.getAccessTokenFromCookie(request);

		if (!token) throw new InvalidTokenError();

		const decoded = this.authService.verifyAccessToken(token);
		const user = await this.userRepo.findOne({
			where: { id: decoded.sub },
			relations: ["userLanguages", "userLanguages.language"],
		});

		const adminRoute =
			this.reflector.get(ADMIN_ROLE_KEY, context.getClass()) ||
			this.reflector.get<boolean>(ADMIN_ROLE_KEY, context.getHandler());

		if (!!adminRoute && !user.isAdmin) return false;

		if (!user.isActive) throw new InvalidTokenError();

		const profile = Profile.fromEntity(user);
		this.cls.set("profile", profile);

		return true;
	}

	getAccessTokenFromHeader(req: Request) {
		const authHeader = req.headers["authorization"];
		if (!authHeader) {
			return null;
		}
		const parts = authHeader.split(" ");
		if (parts.length !== 2 || parts[0] !== "Bearer") {
			return null;
		}
		return parts[1];
	}

	getAccessTokenFromCookie(req: Request) {
		const accessToken = req.cookies.accessToken;
		return accessToken;
	}
}
