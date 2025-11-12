import {
	Controller,
	Param,
	Body,
	Query,
	Post,
	Get,
	Put,
	Delete,
	UseGuards,
} from "@nestjs/common";
import { UserGroupService } from "./user-group.service";
import {
	AddMemberRequest,
	DeleteMemberRequest,
	UpdateUserGroupRequest,
	UserGroupResponse,
} from "./dto";
import {
	ApiMessageResponseDto,
	ApiResponseDto,
	AuditLog,
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
} from "@utils";
import { ApiBearerAuth, ApiOperation, ApiParam } from "@nestjs/swagger";
import { GroupGuard } from "@modules/group";
import { UserResponse } from "@modules/user/dto";

@ApiBearerAuth()
@UseGuards(GroupGuard)
@Controller("group/:groupId/members")
@ApiParam({ name: "groupId", type: String, required: true })
export class UserGroupController {
	constructor(private readonly userGroupService: UserGroupService) {}

	@Post()
	@ApiOperation({ summary: "Add user directly to group (admin action)" })
	@SwaggerApiResponse(UserGroupResponse)
	async addMember(
		@Param("groupId") groupId: string,
		@Body() request: AddMemberRequest,
	) {
		const addedById = ""; // Will be set by CLS in service
		const data = await this.userGroupService.addUserToGroup(
			request.userId,
			groupId,
			addedById,
		);
		return new ApiResponseDto(
			UserGroupResponse.fromEntity(data),
			null,
			"Member added successfully",
		);
	}
	@Get()
	@ApiOperation({ summary: "Get all members of group" })
	@ApiParam({ name: "groupId", description: "Group ID" })
	@SwaggerApiResponse(UserResponse, { isArray: true })
	async getGroupMembers() {
		const data = await this.userGroupService.getGroupMembers();
		return new ApiResponseDto(
			UserResponse.fromEntities(data),
			null,
			"Members retrieved successfully",
		);
	}

	// Now don't have update service, still don't have roles and permissions functions
	@Put(":userId/role")
	@ApiOperation({ summary: "Update member role/permissions" })
	@ApiParam({ name: "groupId", description: "Group ID" })
	@ApiParam({ name: "userId", description: "User ID" })
	@SwaggerApiMessageResponse()
	async updateMember(
		@Param("groupId") groupId: string,
		@Param("userId") userId: string,
		@Body() dto: UpdateUserGroupRequest,
	) {
		return new ApiMessageResponseDto("Member updated successfully");
	}

	@Delete(":userId")
	@ApiOperation({ summary: "Remove member from group" })
	@ApiParam({ name: "userId", description: "User ID to remove" })
	@SwaggerApiMessageResponse()
	async removeMember(@Param("userId") userId: string) {
		const request: DeleteMemberRequest = {
			userId,
		};
		await this.userGroupService.removeMemberByGroupAndUser(request);
		return new ApiMessageResponseDto("Member removed successfully");
	}

	@Get("memberships")
	@ApiOperation({
		summary: "Get all group memberships (including pending)",
	})
	@SwaggerApiResponse(UserGroupResponse, { isArray: true })
	async getGroupMemberships() {
		const data = await this.userGroupService.findMany();
		return new ApiResponseDto(
			UserGroupResponse.fromEntities(data),
			null,
			"Group memberships retrieved successfully",
		);
	}

	@Get(":userId")
	@ApiOperation({ summary: "Get specific member details" })
	@ApiParam({ name: "userId", description: "User ID" })
	@SwaggerApiResponse(UserGroupResponse)
	async getMemberDetails(
		@Param("groupId") groupId: string,
		@Param("userId") userId: string,
	) {
		const data = await this.userGroupService.getMemberByGroupAndUser(
			groupId,
			userId,
		);
		return new ApiResponseDto(
			UserGroupResponse.fromEntity(data),
			null,
			"Member details retrieved successfully",
		);
	}

	@Post("leave")
	@ApiOperation({ summary: "Leave group" })
	@ApiParam({ name: "groupId", description: "Group ID" })
	@SwaggerApiMessageResponse()
	@AuditLog({
		action: "GROUP_LEAVE",
		entityType: "UserGroup",
		entityIdParam: "groupId",
	})
	async leaveGroup(@Param("groupId") groupId: string) {
		await this.userGroupService.leaveGroup(groupId);
		return new ApiMessageResponseDto("Successfully left the group");
	}
}
