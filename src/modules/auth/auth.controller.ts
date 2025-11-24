import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
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
	TokenResponse,
	TokenRefreshRequest,
	LoginPkceRequest,
	LoginPkceResponse,
	PkceIssueTokenRequest,
} from "./dto";
import { SkipAuth } from "../../utils/skip-auth.decorator";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Response } from "express";
import {
	ForgotPasswordRequest,
	SendResetCodeRequest,
	ConfirmResetCodeRequest,
	ResetPasswordRequest,
} from "./dto";

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

	@Get("verify-email")
	@SkipAuth()
	async verifyEmail(@Query("token") token: string) {
		await this.authService.verifyEmail(token);
		return new ApiMessageResponseDto("Email verified successfully");
	}

	@Get("resend-verification-email")
	@SwaggerApiMessageResponse()
	@SkipAuth()
	async resendVerificationEmail(@Query("email") email: string) {
		await this.authService.resendVerificationEmail(email);
		return new ApiMessageResponseDto("Verification email resent successfully");
	}

	@Post("forgot-password")
	@SwaggerApiMessageResponse()
	@SkipAuth()
	async forgotPassword(@Body() dto: ForgotPasswordRequest) {
		await this.authService.forgotPassword(dto);
		return new ApiMessageResponseDto("Reset code has been sent");
	}

	@Post("send-reset-code")
	@SwaggerApiMessageResponse()
	@SkipAuth()
	async sendResetCode(@Body() dto: SendResetCodeRequest) {
		await this.authService.sendResetCode(dto);
		return new ApiMessageResponseDto("Reset code sent successfully");
	}

	@Post("confirm-reset-code")
	@SwaggerApiMessageResponse()
	@SkipAuth()
	async confirmResetCode(@Body() dto: ConfirmResetCodeRequest) {
		await this.authService.confirmResetCode(dto);
		return new ApiMessageResponseDto("Code verified successfully");
	}

	@Post("reset-password")
	@SwaggerApiMessageResponse()
	@SkipAuth()
	async resetPassword(@Body() dto: ResetPasswordRequest) {
		await this.authService.resetPassword(dto);
		return new ApiMessageResponseDto("Password reset successfully");
	}

	@Get("profile")
	@SwaggerApiResponse(Profile)
	@ApiBearerAuth()
	async getProfile() {
		const data = await this.authService.getProfileWithLanguages();
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
