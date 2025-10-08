import {
	Controller,
	Param,
	Body,
	Query,
	Post,
	Get,
	Put,
	Delete,
} from "@nestjs/common";
import { PermissionService } from "./permission.service";
import {
	CreatePermissionRequest,
	UpdatePermissionRequest,
	PermissionQuery,
} from "./dto";
import {
	ApiResponseDto,
	ApiMessageResponseDto,
	RequirePermissions,
	AdminPermissionEnum,
} from "@utils";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Permission")
@ApiBearerAuth()
@RequirePermissions(AdminPermissionEnum.MANAGE_PERMISSIONS)
@Controller("permission")
export class PermissionController {
	constructor(private readonly permissionService: PermissionService) {}

	@Post()
	@ApiOperation({ summary: "Create permission" })
	async createOne(@Body() dto: CreatePermissionRequest) {
		const data = await this.permissionService.createOne(dto);
		return new ApiResponseDto(data, null, "Created successfully");
	}

	@Put(":id")
	@ApiOperation({ summary: "Update permission" })
	async updateOne(
		@Param("id") id: string,
		@Body() dto: UpdatePermissionRequest,
	) {
		const data = await this.permissionService.updateOne(id, dto);
		return new ApiResponseDto(data, null, "Updated successfully");
	}

	@Get()
	@ApiOperation({ summary: "List permissions" })
	async findMany(@Query() query: PermissionQuery) {
		const { data, pagination } = await this.permissionService.findMany(query);
		return new ApiResponseDto(data, pagination);
	}

	@Get(":id")
	@ApiOperation({ summary: "Get permission detail" })
	async findOne(@Param("id") id: string) {
		const data = await this.permissionService.findOne(id);
		return new ApiResponseDto(data);
	}

	@Delete(":id")
	@ApiOperation({ summary: "Soft delete permission" })
	async deleteOne(@Param("id") id: string) {
		await this.permissionService.deleteOne(id);
		return new ApiMessageResponseDto("Deleted successfully");
	}
}
