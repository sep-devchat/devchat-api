import { Body, Controller, Get, Post, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
	ApiMessageResponseDto,
	ApiResponseDto,
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
} from "@utils";
import {
	LoginGitHubRequest,
	LoginGoogleRequest,
	LoginRequest,
	Profile,
	RegisterRequest,
	TokenResponse,
	TokenRefreshRequest,
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
		});
		res.cookie("refreshToken", data.refreshToken, {
			path: "/api/auth/refresh",
			httpOnly: true,
		});
	}

	@Post("register")
	@SwaggerApiMessageResponse()
	@SkipAuth()
	async register(@Body() dto: RegisterRequest) {
		await this.authService.register(dto);
		return new ApiMessageResponseDto("Registration successful");
	}

	@Post("login")
	@SwaggerApiResponse(TokenResponse)
	@SkipAuth()
	async login(@Body() dto: LoginRequest, @Res() res: Response) {
		const data = await this.authService.login(dto);
		this.setCookieAccessToken(data, res);
		res.status(200).send(new ApiResponseDto(data, null, "Login successful"));
	}

	@Post("login-google")
	@SwaggerApiResponse(TokenResponse)
	@SkipAuth()
	async loginGoogle(@Body() dto: LoginGoogleRequest, @Res() res: Response) {
		const data = await this.authService.loginGoogle(dto);
		this.setCookieAccessToken(data, res);
		res
			.status(200)
			.send(new ApiResponseDto(data, null, "Login with Google successful"));
	}

	@Post("login-github")
	@SwaggerApiResponse(TokenResponse)
	@SkipAuth()
	async loginGitHub(@Body() dto: LoginGitHubRequest, @Res() res: Response) {
		const data = await this.authService.loginGitHub(dto);
		this.setCookieAccessToken(data, res);
		res
			.status(200)
			.send(new ApiResponseDto(data, null, "Login with GitHub successful"));
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

	@Get("pkce")
	async() {}
}
