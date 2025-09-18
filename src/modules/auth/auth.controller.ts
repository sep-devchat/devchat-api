import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
	ApiMessageResponseDto,
	ApiResponseDto,
	Env,
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
} from "@utils";
import {
	LoginRequest,
	Profile,
	RegisterRequest,
	TokenResponse,
	TokenRefreshRequest,
	LoginPkceRequest,
	LoginPkceResponse,
	PkceIssueTokenRequest,
} from "./dto";
import { SkipAuth } from "./skip-auth.decorator";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Response } from "express";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	setCookieAccessToken(data: TokenResponse, res: Response) {
		res.cookie("accessToken", data.accessToken, {
			path: "/api",
			httpOnly: true,
			domain: Env.APP_DOMAIN,
		});
		res.cookie("refreshToken", data.refreshToken, {
			path: "/api/auth/refresh",
			httpOnly: true,
			domain: Env.APP_DOMAIN,
		});
	}

	@Post("register")
	@SwaggerApiResponse(TokenResponse)
	@SkipAuth()
	async register(@Body() dto: RegisterRequest) {
		const data = await this.authService.register(dto);
		return new ApiResponseDto(data, null, "Registration successful");
	}

	@Post("login")
	@SwaggerApiResponse(TokenResponse)
	@SkipAuth()
	async login(@Body() dto: LoginRequest, @Res() res: Response) {
		const data = await this.authService.login(dto);
		this.setCookieAccessToken(data, res);
		res.status(200).send(new ApiResponseDto(data, null, "Login successful"));
	}

	@Post("refresh")
	@SwaggerApiResponse(TokenResponse)
	@SkipAuth()
	refresh(@Body() dto: TokenRefreshRequest, @Res() res: Response) {
		const data = this.authService.refresh(dto);
		this.setCookieAccessToken(data, res);
		res
			.status(200)
			.send(new ApiResponseDto(data, null, "Refresh token successful"));
	}

	@Post("login-pkce")
	@SwaggerApiResponse(LoginPkceResponse)
	@SkipAuth()
	async async(@Body() dto: LoginPkceRequest) {
		const data = await this.authService.loginPkce(dto);
		return new ApiResponseDto(data, null, "Login PKCE successful");
	}

	@Post("pkce-issue-token")
	@SwaggerApiResponse(TokenResponse)
	@SkipAuth()
	async pkceIssueToken(@Body() dto: PkceIssueTokenRequest) {
		const data = await this.authService.pkceIssueToken(dto);
		return new ApiResponseDto(data, null, "PKCE issue token successful");
	}

	@Get("profile")
	@SwaggerApiResponse(Profile)
	@ApiBearerAuth()
	getProfile() {
		const data = this.authService.getProfileCls();
		return new ApiResponseDto(data, null, "Get profile successful");
	}

	@Get("logout")
	@SwaggerApiMessageResponse()
	@ApiBearerAuth()
	logout(@Res() res: Response) {
		res.clearCookie("accessToken", { path: "/api" });
		res.clearCookie("refreshToken", { path: "/api/auth/refresh" });
		res.status(200).send(new ApiMessageResponseDto("Logout successful"));
	}
}
