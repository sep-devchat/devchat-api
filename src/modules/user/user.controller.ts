import {
	Controller,
	Delete,
	Get,
	Patch,
	Post,
	Param,
	Body,
	Put,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { ApiResponseDto, SwaggerApiMessageResponse } from "@utils";
import { CreateUserRequest } from "./dto/create-user.request";
import { ApiBody, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { UserEntity } from "@db/entities";
import { SkipAuth } from "@modules/auth";
import { UpdateUserRequest } from "./dto";

@ApiTags("Users") // Add API tag
@Controller("user")
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get(":id")
	@ApiOperation({ summary: "Get user by ID" })
	@ApiParam({ name: "id", description: "User ID" })
	async getUser(@Param("id") id: string) {
		const response = await this.userService.findById(id);
		return new ApiResponseDto<UserEntity>(
			response,
			null,
			"User retrieved successfully",
		);
	}

	@Post()
	@ApiOperation({ summary: "Create a new user" })
	@ApiBody({ type: CreateUserRequest }) // Add this line
	async createUser(@Body() dto: CreateUserRequest) {
		const response = await this.userService.create(dto);
		return new ApiResponseDto<UserEntity>(
			response,
			null,
			"User created successfully",
		);
	}

	@Put(":id")
	@ApiOperation({ summary: "Update user" })
	@ApiParam({ name: "id", description: "User ID" })
	async updateUser(
		@Param("id") id: string,
		@Body() updateData: UpdateUserRequest,
	) {
		const response = await this.userService.update(id, updateData);

		return new ApiResponseDto<UserEntity>(
			response,
			null,
			"User updated successfully",
		);
	}

	@Delete(":id")
	@ApiOperation({ summary: "Delete user" })
	@ApiParam({ name: "id", description: "User ID" })
	async deleteUser(@Param("id") id: string) {
		await this.userService.delete(id);
		return new ApiResponseDto(null, null, "User deleted successfully");
	}

	@Get()
	@ApiOperation({ summary: "Get all users" })
	async getUsers() {
		const response = await this.userService.getAll();
		return new ApiResponseDto<UserEntity[]>(
			response,
			null,
			"Users retrieved successfully",
		);
	}
}
