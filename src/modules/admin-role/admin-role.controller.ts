import {
	Controller,
	Param,
	Body,
	Query,
	Post,
	Get,
	Put,
	Delete,
	Req,
} from "@nestjs/common";
import { AdminRoleService } from "./admin-role.service";
import {
	CreateAdminRoleRequest,
	UpdateAdminRoleRequest,
	AdminRoleQuery,
	AssignUserRoleRequest,
} from "./dto";
import {
	ApiResponseDto,
	ApiMessageResponseDto,
	SwaggerApiResponse,
	SwaggerApiMessageResponse,
	AdminPermissionEnum,
	RequirePermissions,
} from "@utils";
import { AdminRoleResponse } from "./dto";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("AdminRole")
@ApiBearerAuth()
@RequirePermissions(AdminPermissionEnum.MANAGE_ROLES)
@Controller("admin-role")
export class AdminRoleController {
	constructor(private readonly adminRoleService: AdminRoleService) {}

	@Post()
	@ApiOperation({ summary: "Create a new admin role" })
	@SwaggerApiResponse(AdminRoleResponse)
	async createOne(@Body() dto: CreateAdminRoleRequest) {
		const data = await this.adminRoleService.createOne(dto);
		return new ApiResponseDto(data, null, "Created successfully");
	}

	@Put(":id")
	@ApiOperation({ summary: "Update an admin role" })
	@SwaggerApiResponse(AdminRoleResponse)
	async updateOne(
		@Param("id") id: string,
		@Body() dto: UpdateAdminRoleRequest,
	) {
		const data = await this.adminRoleService.updateOne(id, dto);
		return new ApiResponseDto(data, null, "Updated successfully");
	}

	@Get()
	@ApiOperation({ summary: "List admin roles" })
	@SwaggerApiResponse(AdminRoleResponse, {
		isArray: true,
		withPagination: true,
	})
	async findMany(@Query() query: AdminRoleQuery) {
		const { data, pagination } = await this.adminRoleService.findMany(query);
		return new ApiResponseDto(data, pagination as any);
	}

	@Get(":id")
	@ApiOperation({ summary: "Get admin role detail" })
	@SwaggerApiResponse(AdminRoleResponse)
	async findOne(@Param("id") id: string) {
		const data = await this.adminRoleService.findOne(id);
		return new ApiResponseDto(data);
	}

	@Delete(":id")
	@ApiOperation({ summary: "Soft delete an admin role" })
	@SwaggerApiMessageResponse()
	async deleteOne(@Param("id") id: string) {
		await this.adminRoleService.deleteOne(id);
		return new ApiMessageResponseDto("Deleted successfully");
	}

	@Post(":roleId/assign")
	@ApiOperation({ summary: "Assign user to role" })
	@SwaggerApiResponse(AdminRoleResponse)
	async assignUser(
		@Param("roleId") roleId: string,
		@Body() body: AssignUserRoleRequest,
	) {
		const data = await this.adminRoleService.assignUser(roleId, body.userId);
		return new ApiResponseDto(data, null, "User assigned");
	}

	@Post("unassign")
	@ApiOperation({ summary: "Remove user from any role" })
	@SwaggerApiResponse(AdminRoleResponse)
	async unassignUser(@Body() body: AssignUserRoleRequest) {
		const data = await this.adminRoleService.unassignUser(body.userId);
		return new ApiResponseDto(data, null, "User unassigned");
	}
}
