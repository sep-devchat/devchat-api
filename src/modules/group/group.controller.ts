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
import { GroupService } from "./group.service";
import {
	CreateGroupRequest,
	UpdateGroupRequest,
	GroupQuery,
	GroupResponse,
} from "./dto";
import {
	ApiMessageResponseDto,
	ApiResponseDto,
	AuditLog,
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
} from "@utils";
import { ApiBearerAuth, ApiOperation, ApiParam } from "@nestjs/swagger";
import { GroupEntity } from "@db/entities";
import { TaskService } from "@modules/task";
import { CreateTaskRequest, TaskQuery, TaskResponse } from "@modules/task/dto";

@Controller("group")
@ApiBearerAuth()
export class GroupController {
	constructor(private readonly groupService: GroupService) {}

	@Post()
	@ApiOperation({ summary: "Create a new group" })
	@SwaggerApiResponse(GroupResponse)
	@AuditLog({
		action: "GROUP_CREATE",
		entityType: "Group",
		entity: GroupEntity,
		captureResponse: true,
	})
	async createOne(@Body() dto: CreateGroupRequest) {
		const data = await this.groupService.createOne(dto);
		return new ApiResponseDto(
			GroupResponse.fromEntity(data),
			null,
			"Created successfully",
		);
	}

	@Put(":groupId")
	@ApiParam({ name: "groupId", description: "Group ID" })
	@ApiOperation({ summary: "Update a group" })
	@SwaggerApiMessageResponse()
	@AuditLog({
		action: "GROUP_UPDATE",
		entityType: "Group",
		entity: GroupEntity,
		entityIdParam: "groupId",
	})
	async updateOne(
		@Param("groupId") groupId: string,
		@Body() dto: UpdateGroupRequest,
	) {
		await this.groupService.updateOne(groupId, dto);
		return new ApiMessageResponseDto("Updated group successfully");
	}

	@Get()
	@ApiOperation({ summary: "Get list of groups" })
	@SwaggerApiResponse(GroupResponse)
	async findMany() {
		const response = await this.groupService.findMany();
		return new ApiResponseDto(
			GroupResponse.fromEntities(response),
			null,
			"Groups retrieved successfully",
		);
	}

	@Get(":groupId")
	@ApiOperation({ summary: "Get group by ID" })
	@ApiParam({ name: "groupId", description: "Group ID" })
	@SwaggerApiResponse(GroupResponse)
	async findOne(@Param("groupId") groupId: string) {
		const data = await this.groupService.findOne(groupId);
		return new ApiResponseDto(
			GroupResponse.fromEntity(data),
			null,
			"Group retrieved successfully",
		);
	}

	@Delete(":groupId")
	@ApiOperation({ summary: "Delete a group" })
	@ApiParam({ name: "groupId", description: "Group ID" })
	@SwaggerApiMessageResponse()
	async deleteOne(@Param("groupId") groupId: string) {
		await this.groupService.deleteOne(groupId);
		return new ApiMessageResponseDto("Deleted group successfully");
	}
}
