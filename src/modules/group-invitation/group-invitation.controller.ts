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
	CreateGroupInviteLinkDto,
	CreateGroupInviteLinkResponse,
	JoinViaLinkDto,
	GroupInviteLinkPublicResponse,
} from "./dto";
import {
	ApiResponseDto,
	ApiMessageResponseDto,
	AuditLog,
	SwaggerApiResponse,
	SwaggerApiMessageResponse,
	Env,
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
		summary: "Update group invitation",
		description:
			"Update group invitation message. Only the sender or recipient can update.",
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
			"Accept a group invitation. Creates membership and deletes the invitation. Only the recipient can accept.",
	})
	@SwaggerApiMessageResponse()
	@AuditLog({
		action: "GROUP_INVITATION_ACCEPT",
		entityType: "GroupInvitation",
		entity: GroupInvitationEntity,
		entityIdParam: "id",
		captureResponse: true,
	})
	async acceptInvitation(@Param("id") id: string) {
		const response = await this.groupInvitationService.acceptInvitation(id);
		return new ApiMessageResponseDto(response.message);
	}

	@Patch(":id/decline")
	@ApiParam({ name: "id", description: "Group Invitation ID" })
	@ApiOperation({
		summary: "Decline a group invitation",
		description:
			"Decline a group invitation. Deletes the invitation. Only the recipient can decline.",
	})
	@SwaggerApiMessageResponse()
	@AuditLog({
		action: "GROUP_INVITATION_DECLINE",
		entityType: "GroupInvitation",
		entity: GroupInvitationEntity,
		entityIdParam: "id",
		captureResponse: true,
	})
	async declineInvitation(@Param("id") id: string) {
		const response = await this.groupInvitationService.declineInvitation(id);
		return new ApiMessageResponseDto(response.message);
	}

	@Delete(":id")
	@ApiParam({ name: "id", description: "Group Invitation ID" })
	@ApiOperation({
		summary: "Delete a group invitation",
		description:
			"Delete a group invitation. Only the sender can delete their own invitations.",
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

	@Post("invite-link")
	@ApiOperation({ summary: "Create a new invite link for a group" })
	@SwaggerApiResponse(CreateGroupInviteLinkResponse)
	@AuditLog({
		action: "GROUP_INVITE_LINK_CREATE",
		entityType: "GroupInviteLink",
		captureResponse: true,
	})
	async createInviteLink(@Body() dto: CreateGroupInviteLinkDto) {
		const inviteLink = await this.groupInvitationService.createInviteLink(dto);
		const payload = CreateGroupInviteLinkResponse.fromToken(inviteLink.token);

		return new ApiResponseDto(
			payload,
			null,
			"Invite link created successfully",
		);
	}

	@Get("public/invite-link/:token")
	@ApiParam({ name: "token", description: "Invite Link Token" })
	@ApiOperation({
		summary: "Get public info for an invite link",
		description:
			"Get public information about an invite link (no authentication required)",
	})
	@SwaggerApiResponse(GroupInviteLinkPublicResponse)
	async getInviteLinkPublicInfo(@Param("token") token: string) {
		const data =
			await this.groupInvitationService.getInviteLinkPublicInfo(token);
		return new ApiResponseDto(
			GroupInviteLinkPublicResponse.fromEntity(data),
			null,
			"Invite link information retrieved successfully",
		);
	}

	@Post("join-via-link")
	@ApiOperation({
		summary: "Join a group via invite link",
		description: "Join a group using an invite link token",
	})
	@SwaggerApiMessageResponse()
	@AuditLog({
		action: "GROUP_JOIN_VIA_LINK",
		entityType: "GroupInviteLink",
		captureResponse: true,
	})
	async joinViaLink(@Body() dto: JoinViaLinkDto) {
		const response = await this.groupInvitationService.joinViaLink(dto);
		return new ApiMessageResponseDto(response.message);
	}
}
