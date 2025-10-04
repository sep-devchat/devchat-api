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
import { UserGroupService } from "./user-group.service";
import {
	CreateUserGroupRequest,
	UpdateUserGroupRequest,
	UserGroupQuery,
	UserGroupResponse,
} from "./dto";
import {
	ApiMessageResponseDto,
	ApiResponseDto,
	SwaggerApiMessageResponse,
	SwaggerApiResponse,
} from "@utils";
import { ApiBearerAuth, ApiOperation, ApiParam } from "@nestjs/swagger";
import { MemberResponse } from "./dto/member.response";

@Controller("group")
@ApiBearerAuth()
export class UserGroupController {
	constructor(private readonly userGroupService: UserGroupService) {}

	@Post(":groupId/member/:userId")
	@ApiOperation({ summary: "Add member to group" })
	@ApiParam({ name: "groupId", description: "Group ID" })
	@SwaggerApiResponse(UserGroupResponse)
	async addMember(
		@Param("groupId") groupId: string,
		@Param("userId") userId: string,
	) {
		// Override groupId from URL
		const data = await this.userGroupService.createOne(groupId, userId);
		return new ApiResponseDto(
			UserGroupResponse.fromEntity(data),
			null,
			"Member added successfully",
		);
	}

	@Get(":groupId/member")
	@ApiOperation({ summary: "Get all members of group" })
	@ApiParam({ name: "groupId", description: "Group ID" })
	@SwaggerApiResponse(MemberResponse, { isArray: true, withPagination: true })
	async getGroupMembers(
		@Param("groupId") groupId: string,
		@Query() query: UserGroupQuery,
	) {
		const data = await this.userGroupService.getGroupMembers(groupId, query);
		return new ApiResponseDto(
			MemberResponse.fromEntities(data.users),
			data.pagination,
			"Members retrieved successfully",
		);
	}

	@Get(":groupId/member/:userId")
	@ApiOperation({ summary: "Get specific member in group" })
	@ApiParam({ name: "groupId", description: "Group ID" })
	@ApiParam({ name: "userId", description: "User ID" })
	@SwaggerApiResponse(MemberResponse)
	async getMember(
		@Param("groupId") groupId: string,
		@Param("userId") userId: string,
	) {
		const data = await this.userGroupService.getMemberByGroupAndUser(
			groupId,
			userId,
		);
		return new ApiResponseDto(
			MemberResponse.fromEntity(data.user),
			null,
			"Member retrieved successfully",
		);
	}

	// Now don't have update service, still don't have roles and permissions functions
	@Put(":groupId/member/:userId")
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

	@Delete(":groupId/member/:userId")
	@ApiOperation({ summary: "Remove member from group" })
	@ApiParam({ name: "groupId", description: "Group ID" })
	@ApiParam({ name: "userId", description: "User ID" })
	@SwaggerApiMessageResponse()
	async removeMember(
		@Param("groupId") groupId: string,
		@Param("userId") userId: string,
	) {
		await this.userGroupService.removeMemberByGroupAndUser(groupId, userId);
		return new ApiMessageResponseDto("Member removed successfully");
	}
}
