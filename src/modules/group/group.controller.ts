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
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
} from "@utils";
import { ApiBearerAuth, ApiOperation, ApiParam } from "@nestjs/swagger";

@Controller("group")
@ApiBearerAuth()
export class GroupController {
	constructor(private readonly groupService: GroupService) {}

	@Post()
	@ApiOperation({ summary: "Create a new group" })
	@SwaggerApiResponse(GroupResponse)
	async createOne(@Body() dto: CreateGroupRequest) {
		const response = await this.groupService.createOne(dto);
		return new ApiResponseDto(
			GroupResponse.fromEntity(response),
			null,
			"Created successfully",
		);
	}

	@Put(":id")
	@ApiParam({ name: "id", description: "Group ID" })
	@ApiOperation({ summary: "Update a group" })
	@SwaggerApiMessageResponse()
	async updateOne(@Param("id") id: string, @Body() dto: UpdateGroupRequest) {
		await this.groupService.updateOne(id, dto);
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

	@Get(":id")
	@ApiOperation({ summary: "Get group by ID" })
	@ApiParam({ name: "id", description: "Group ID" })
	@SwaggerApiResponse(GroupResponse)
	async findOne(@Param("id") id: string) {
		const data = await this.groupService.findOne(id);
		return new ApiResponseDto(
			GroupResponse.fromEntity(data),
			null,
			"Group retrieved successfully",
		);
	}

	@Delete(":id")
	@ApiOperation({ summary: "Delete a group" })
	@ApiParam({ name: "id", description: "Group ID" })
	@SwaggerApiMessageResponse()
	async deleteOne(@Param("id") id: string) {
		await this.groupService.deleteOne(id);
		return new ApiMessageResponseDto("Deleted group successfully");
	}
}
