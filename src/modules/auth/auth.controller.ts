import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
	ApiMessageResponseDto,
	ApiResponseDto,
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
} from "@utils";
import { LoginRequest, Profile, RegisterRequest, TokenResponse } from "./dto";
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

	@Get("profile")
	@SwaggerApiResponse(Profile)
	@ApiBearerAuth()
	getProfile() {
		const data = this.authService.getProfileCls();
		return new ApiResponseDto(data, null, "Get profile successful");
	}
}
