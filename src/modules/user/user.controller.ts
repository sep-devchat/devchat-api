import {
	Controller,
	Delete,
	Get,
	Patch,
	Post,
	Param,
	Body,
	Put,
	Query,
} from "@nestjs/common";
import { UserService } from "./user.service";
import {
	ApiMessageResponseDto,
	ApiResponseDto,
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
} from "@utils";
import { CreateUserRequest } from "./dto/create-user.request";
import { ApiBody, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { UserEntity } from "@db/entities";
import { SkipAuth } from "@modules/auth";
import { UpdateUserRequest } from "./dto";
import { UserResponse } from "./dto/user.response";
import { TokenResponse } from "@modules/auth/dto";
import { RegisterRequest } from "./dto/register.request";

@ApiTags("Users") // Add API tag
@Controller("user")
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get(":uniqueKey")
	@ApiOperation({ summary: "Get user by unique key (ID, username, or email)" })
	@ApiParam({ name: "uniqueKey", description: "User ID, username, or email" })
	@SwaggerApiResponse(UserResponse, { isArray: true, withPagination: true })
	async getUserByUniqueKey(@Param("uniqueKey") uniqueKey: string) {
		const response = await this.userService.findByUniqueKey(uniqueKey);
		return new ApiResponseDto<UserResponse>(
			UserResponse.fromEntity(response),
			null,
			"User retrieved successfully",
		);
	}

	@Post("register")
	@ApiOperation({ summary: "Register a new user" })
	@SwaggerApiResponse(TokenResponse)
	@SkipAuth()
	async register(@Body() dto: RegisterRequest) {
		const data = await this.userService.register(dto);
		return new ApiResponseDto(data, null, "Registration successful");
	}

	@SkipAuth()
	@Put(":id")
	@ApiOperation({ summary: "Update user" })
	@ApiParam({ name: "id", description: "User ID" })
	@SwaggerApiMessageResponse()
	async updateUser(
		@Param("id") id: string,
		@Body() updateData: UpdateUserRequest,
	) {
		this.userService.update(id, updateData);

		return new ApiMessageResponseDto("User updated successfully");
	}

	@Delete(":id")
	@ApiOperation({ summary: "Delete user" })
	@ApiParam({ name: "id", description: "User ID" })
	@SwaggerApiMessageResponse()
	async deleteUser(@Param("id") id: string) {
		await this.userService.delete(id);
		return new ApiMessageResponseDto("User deleted successfully");
	}

	@Get()
	@ApiOperation({ summary: "Get all users" })
	@SwaggerApiResponse(UserResponse, { isArray: true, withPagination: true })
	@SkipAuth()
	async getUsers(
		@Query("page") page: number = 1,
		@Query("limit") limit: number = 10,
	) {
		const response = await this.userService.getAll(page, limit);
		return new ApiResponseDto<UserResponse[]>(
			UserResponse.fromEntities(response.data),
			response.pagination,
			"Users retrieved successfully",
		);
	}
}
