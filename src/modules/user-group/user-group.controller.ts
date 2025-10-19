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
	CreateInvitationRequest,
	DeleteMemberRequest,
	UpdateUserGroupRequest,
	UserGroupResponse,
} from "./dto";
import {
	ApiMessageResponseDto,
	ApiResponseDto,
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
} from "@utils";
import { ApiBearerAuth, ApiOperation, ApiParam } from "@nestjs/swagger";
import { UpdateInvitationRequest } from "./dto/update-invitation.request";
import { GroupGuard } from "@modules/group";
import { UserResponse } from "@modules/user/dto";

@ApiBearerAuth()
@UseGuards(GroupGuard)
@Controller("group/:groupId/member")
@ApiParam({ name: "groupId", type: String, required: true })
export class UserGroupController {
	constructor(private readonly userGroupService: UserGroupService) {}

	@Post()
	@ApiOperation({ summary: "Invite a user to group" })
	@SwaggerApiResponse(UserGroupResponse)
	async addMember(@Body() request: CreateInvitationRequest) {
		// Override groupId from URL
		const data = await this.userGroupService.inviteUser(request);
		return new ApiResponseDto(
			UserGroupResponse.fromEntity(data),
			null,
			"Member added successfully",
		);
	}

	@Put()
	@ApiOperation({ summary: "Update invitation (accept/declined)" })
	@SwaggerApiResponse(UserGroupResponse)
	async acceptInvitation(@Body() body: UpdateInvitationRequest) {
		const data = await this.userGroupService.updateInvitationStatus(body);
		return new ApiResponseDto(
			UserGroupResponse.fromEntity(data),
			null,
			`Invitation updated successfully`,
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
	@Put("/role")
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

	@Delete()
	@ApiOperation({ summary: "Remove member from group" })
	@SwaggerApiMessageResponse()
	async removeMember(@Body() request: DeleteMemberRequest) {
		await this.userGroupService.removeMemberByGroupAndUser(request);
		return new ApiMessageResponseDto("Member removed successfully");
	}
}
