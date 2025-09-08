import { Body, Controller, Get, Post } from "@nestjs/common";
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

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

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
	async login(@Body() dto: LoginRequest) {
		const data = await this.authService.login(dto);
		return new ApiResponseDto(data, null, "Login successful");
	}

	@Post("login-google")
	@SwaggerApiResponse(TokenResponse)
	@SkipAuth()
	async loginGoogle(@Body() dto: LoginGoogleRequest) {
		const data = await this.authService.loginGoogle(dto);
		return new ApiResponseDto(data, null, "Login with Google successful");
	}

	@Post("login-github")
	@SwaggerApiResponse(TokenResponse)
	@SkipAuth()
	async loginGitHub(@Body() dto: LoginGitHubRequest) {
		const data = await this.authService.loginGitHub(dto);
		return new ApiResponseDto(data, null, "Login with GitHub successful");
	}

	@Post("refresh")
	@SwaggerApiResponse(TokenResponse)
	@SkipAuth()
	async refresh(@Body() dto: TokenRefreshRequest) {
		const data = await this.authService.refresh(dto);
		return new ApiResponseDto(data, null, "Refresh token successful");
	}

	@Get("profile")
	@SwaggerApiResponse(Profile)
	@ApiBearerAuth()
	getProfile() {
		const data = this.authService.getProfileCls();
		return new ApiResponseDto(data, null, "Get profile successful");
	}
}
