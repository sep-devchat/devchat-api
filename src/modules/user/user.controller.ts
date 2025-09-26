import {
	Controller,
	Delete,
	Get,
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
import { ApiBearerAuth, ApiOperation, ApiParam } from "@nestjs/swagger";
import { SkipAuth } from "@modules/auth";
import { UpdateUserRequest, UserQuery } from "./dto";
import { UserResponse } from "./dto/user.response";

@Controller("user")
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get(":uniqueKey")
	@ApiBearerAuth()
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

	@Post()
	@ApiOperation({ summary: "Create a new user" })
	@SwaggerApiMessageResponse()
	@SkipAuth()
	async register(@Body() dto: CreateUserRequest) {
		await this.userService.create(dto);
		return new ApiMessageResponseDto("User created successfully");
	}

	@Put(":id")
	@ApiBearerAuth()
	@ApiOperation({ summary: "Update user" })
	@ApiParam({ name: "id", description: "User ID" })
	@SwaggerApiMessageResponse()
	async updateUser(
		@Param("id") id: string,
		@Body() updateData: UpdateUserRequest,
	) {
		await this.userService.update(id, updateData);

		return new ApiMessageResponseDto("User updated successfully");
	}

	@Delete(":id")
	@ApiBearerAuth()
	@ApiOperation({ summary: "Delete user" })
	@ApiParam({ name: "id", description: "User ID" })
	@SwaggerApiMessageResponse()
	async deleteUser(@Param("id") id: string) {
		await this.userService.delete(id);
		return new ApiMessageResponseDto("User deleted successfully");
	}

	@Get()
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get all users" })
	@SwaggerApiResponse(UserResponse, { isArray: true, withPagination: true })
	async getUsers(@Query() query: UserQuery) {
		const response = await this.userService.getAll(query);
		return new ApiResponseDto<UserResponse[]>(
			UserResponse.fromEntities(response.data),
			response.pagination,
			"Users retrieved successfully",
		);
	}
}
