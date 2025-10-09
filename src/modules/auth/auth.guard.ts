import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { ClsService } from "nestjs-cls";
import { DevChatCls, PERMISSIONS_KEY } from "@utils";
import { Request } from "express";
import { ForbiddenPermissionError, InvalidTokenError } from "./errors";
import { Profile } from "./dto";
import { Reflector } from "@nestjs/core";
import { SKIP_AUTH_KEY } from "../../utils/skip-auth.decorator";
import { UserService } from "@modules/user";
import { AdminRoleRepository } from "@db/repositories";

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly authService: AuthService,
		private readonly userService: UserService,
		private readonly cls: ClsService<DevChatCls>,
		private readonly reflector: Reflector,
		private readonly adminRoleRepo: AdminRoleRepository,
	) {}

	async canActivate(context: ExecutionContext) {
		// Bypass if controller or handler has @SkipAuth()
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
		const user = await this.userService.findById(decoded.sub);
		console.log("Admin role:", user.adminRoleId);
		const profile = Profile.fromEntity(user);
		let adminRole = null as any;
		if (user.adminRoleId) {
			adminRole = await this.adminRoleRepo.findOne({
				where: { id: user.adminRoleId },
			});
		}
		console.log("Admin Role in Auth Guard:", adminRole);
		this.cls.set("profile", adminRole ? { ...profile, adminRole } : profile);

		if (adminRole) {
			const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
				PERMISSIONS_KEY,
				[context.getHandler(), context.getClass()],
			);

			if (!requiredPermissions || requiredPermissions.length === 0) return true;

			// Inactive role => treat as no permissions at all
			if (!adminRole.isActive) {
				throw new ForbiddenPermissionError(
					requiredPermissions,
					requiredPermissions,
				);
			}

			const userPermissions = new Set<string>(adminRole.permissions ?? []);

			// Super admin bypass
			if (userPermissions.has("SUPER_ADMIN")) return true;

			const missing = requiredPermissions.filter(
				(p) => !userPermissions.has(p),
			);

			if (missing.length > 0)
				throw new ForbiddenPermissionError(missing, requiredPermissions);
		}

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
