import {
	Controller,
	Param,
	Body,
	Query,
	Post,
	Get,
	Put,
	Delete,
	Patch,
} from "@nestjs/common";
import { GroupInvitationService } from "./group-invitation.service";
import {
	CreateGroupInvitationDto,
	UpdateGroupInvitationRequest,
	GroupInvitationQuery,
	GroupInvitationResponse,
} from "./dto";
import {
	ApiResponseDto,
	ApiMessageResponseDto,
	AuditLog,
	SwaggerApiResponse,
	SwaggerApiMessageResponse,
} from "@utils";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiParam,
	ApiTags,
} from "@nestjs/swagger";
import { GroupInvitationEntity } from "@db/entities/group-invitation.entity";

@Controller("group-invitation")
@ApiTags("Group Invitation")
@ApiBearerAuth()
export class GroupInvitationController {
	constructor(
		private readonly groupInvitationService: GroupInvitationService,
	) {}

	@Post()
	@ApiOperation({ summary: "Send a group invitation" })
	@SwaggerApiResponse(GroupInvitationResponse)
	@AuditLog({
		action: "GROUP_INVITATION_CREATE",
		entityType: "GroupInvitation",
		entity: GroupInvitationEntity,
		captureResponse: true,
	})
	async sendGroupInvitation(@Body() dto: CreateGroupInvitationDto) {
		const response = await this.groupInvitationService.createOne(dto);
		return new ApiResponseDto(
			GroupInvitationResponse.fromEntity(response),
			null,
			"Group invitation sent successfully",
		);
	}

	@Put(":id")
	@ApiParam({ name: "id", description: "Group Invitation ID" })
	@ApiOperation({
		summary: "Update group invitation status",
		description:
			"Accept, decline, or update a group invitation. Only the recipient can update the status.",
	})
	@SwaggerApiResponse(GroupInvitationResponse)
	@AuditLog({
		action: "GROUP_INVITATION_UPDATE",
		entityType: "GroupInvitation",
		entity: GroupInvitationEntity,
		entityIdParam: "id",
		captureResponse: true,
	})
	async updateGroupInvitation(
		@Param("id") id: string,
		@Body() dto: UpdateGroupInvitationRequest,
	) {
		const response = await this.groupInvitationService.updateOne(id, dto);
		return new ApiResponseDto(
			GroupInvitationResponse.fromEntity(response),
			null,
			"Group invitation updated successfully",
		);
	}

	@Get()
	@ApiOperation({
		summary: "Get group invitations",
		description:
			"Get paginated list of group invitations with filtering options (sent, received, or all)",
	})
	@SwaggerApiResponse(GroupInvitationResponse, {
		isArray: true,
		withPagination: true,
	})
	async getGroupInvitations(@Query() query: GroupInvitationQuery) {
		const { data, pagination } =
			await this.groupInvitationService.findMany(query);
		return new ApiResponseDto(
			GroupInvitationResponse.fromEntities(data),
			pagination,
			"Group invitations retrieved successfully",
		);
	}

	@Get("pending/count")
	@ApiOperation({
		summary: "Get pending group invitations count",
		description:
			"Get the count of pending group invitations received by the current user",
	})
	@SwaggerApiResponse(Number)
	async getPendingInvitationsCount() {
		const count =
			await this.groupInvitationService.getPendingInvitationsCount();
		return new ApiResponseDto(
			{ count },
			null,
			"Pending group invitations count retrieved successfully",
		);
	}

	@Get("group/:groupId")
	@ApiParam({ name: "groupId", description: "Group ID" })
	@ApiOperation({
		summary: "Get invitations for a specific group",
		description: "Get paginated list of invitations for a specific group",
	})
	@SwaggerApiResponse(GroupInvitationResponse, {
		isArray: true,
		withPagination: true,
	})
	async getInvitationsByGroup(
		@Param("groupId") groupId: string,
		@Query() query: GroupInvitationQuery,
	) {
		const { data, pagination } =
			await this.groupInvitationService.getInvitationsByGroup(groupId, query);
		return new ApiResponseDto(
			GroupInvitationResponse.fromEntities(data),
			pagination,
			"Group invitations retrieved successfully",
		);
	}

	@Get(":id")
	@ApiParam({ name: "id", description: "Group Invitation ID" })
	@ApiOperation({
		summary: "Get a specific group invitation",
		description:
			"Get details of a specific group invitation. Users can only access invitations they sent or received.",
	})
	@SwaggerApiResponse(GroupInvitationResponse)
	async getGroupInvitation(@Param("id") id: string) {
		const data = await this.groupInvitationService.findOne(id);
		return new ApiResponseDto(
			GroupInvitationResponse.fromEntity(data),
			null,
			"Group invitation retrieved successfully",
		);
	}

	@Patch(":id/accept")
	@ApiParam({ name: "id", description: "Group Invitation ID" })
	@ApiOperation({
		summary: "Accept a group invitation",
		description:
			"Accept a pending group invitation. Only the recipient can accept.",
	})
	@SwaggerApiResponse(GroupInvitationResponse)
	@AuditLog({
		action: "GROUP_INVITATION_ACCEPT",
		entityType: "GroupInvitation",
		entity: GroupInvitationEntity,
		entityIdParam: "id",
		captureResponse: true,
	})
	async acceptGroupInvitation(@Param("id") id: string) {
		const response = await this.groupInvitationService.acceptInvitation(id);
		return new ApiResponseDto(
			GroupInvitationResponse.fromEntity(response),
			null,
			"Group invitation accepted successfully",
		);
	}

	@Patch(":id/decline")
	@ApiParam({ name: "id", description: "Group Invitation ID" })
	@ApiOperation({
		summary: "Decline a group invitation",
		description:
			"Decline a pending group invitation. Only the recipient can decline.",
	})
	@SwaggerApiResponse(GroupInvitationResponse)
	@AuditLog({
		action: "GROUP_INVITATION_DECLINE",
		entityType: "GroupInvitation",
		entity: GroupInvitationEntity,
		entityIdParam: "id",
		captureResponse: true,
	})
	async declineGroupInvitation(@Param("id") id: string) {
		const response = await this.groupInvitationService.declineInvitation(id);
		return new ApiResponseDto(
			GroupInvitationResponse.fromEntity(response),
			null,
			"Group invitation declined successfully",
		);
	}

	@Patch(":id/cancel")
	@ApiParam({ name: "id", description: "Group Invitation ID" })
	@ApiOperation({
		summary: "Cancel a group invitation",
		description:
			"Cancel a pending group invitation. Only the sender can cancel their own invitations.",
	})
	@SwaggerApiResponse(GroupInvitationResponse)
	@AuditLog({
		action: "GROUP_INVITATION_CANCEL",
		entityType: "GroupInvitation",
		entity: GroupInvitationEntity,
		entityIdParam: "id",
		captureResponse: true,
	})
	async cancelGroupInvitation(@Param("id") id: string) {
		const response = await this.groupInvitationService.cancelInvitation(id);
		return new ApiResponseDto(
			GroupInvitationResponse.fromEntity(response),
			null,
			"Group invitation cancelled successfully",
		);
	}

	@Delete(":id")
	@ApiParam({ name: "id", description: "Group Invitation ID" })
	@ApiOperation({
		summary: "Delete a group invitation",
		description:
			"Delete a pending group invitation. Only the sender can delete their own pending invitations.",
	})
	@SwaggerApiMessageResponse()
	@AuditLog({
		action: "GROUP_INVITATION_DELETE",
		entityType: "GroupInvitation",
		entity: GroupInvitationEntity,
		entityIdParam: "id",
	})
	async deleteGroupInvitation(@Param("id") id: string) {
		await this.groupInvitationService.deleteOne(id);
		return new ApiMessageResponseDto("Group invitation deleted successfully");
	}
}
