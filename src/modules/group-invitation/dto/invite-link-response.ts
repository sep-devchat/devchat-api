import { ApiProperty } from "@nestjs/swagger";
import { GroupInviteLinkEntity } from "@db/entities";
import { UserResponse } from "@modules/user/dto";
import { GroupResponse } from "@modules/group/dto";

export class GroupInviteLinkResponse {
	@ApiProperty({
		description: "Unique identifier for the invite link",
		example: "550e8400-e29b-41d4-a716-446655440000",
	})
	id: string;

	@ApiProperty({
		description: "Group ID this invite link belongs to",
		example: "550e8400-e29b-41d4-a716-446655440001",
	})
	groupId: string;

	@ApiProperty({
		description: "Group information",
		type: () => GroupResponse,
	})
	group?: GroupResponse;

	@ApiProperty({
		description: "User who created this invite link",
		example: "550e8400-e29b-41d4-a716-446655440002",
	})
	createdBy: string;

	@ApiProperty({
		description: "Creator information",
		type: () => UserResponse,
	})
	creator?: UserResponse;

	@ApiProperty({
		description: "Unique token for the invite link",
		example: "abc123def456ghi789",
	})
	token: string;

	@ApiProperty({
		description: "Optional name/label for the invite link",
		example: "Weekly Team Meeting",
		required: false,
	})
	name?: string;

	@ApiProperty({
		description: "Optional description for the invite link",
		example: "Link for new team members to join our weekly meetings",
		required: false,
	})
	description?: string;

	@ApiProperty({
		description: "Expiration date of the invite link",
		example: "2024-12-31T23:59:59.000Z",
		required: false,
	})
	expiresAt?: Date;

	@ApiProperty({
		description: "Maximum number of uses for this invite link",
		example: 50,
		required: false,
	})
	maxUses?: number;

	@ApiProperty({
		description: "Current number of times this link has been used",
		example: 5,
	})
	usedCount: number;

	@ApiProperty({
		description: "Whether the invite link is active",
		example: true,
	})
	isActive: boolean;

	@ApiProperty({
		description: "When the invite link was created",
		example: "2024-01-01T10:00:00.000Z",
	})
	createdAt: Date;

	@ApiProperty({
		description: "When the invite link was last updated",
		example: "2024-01-02T15:30:00.000Z",
	})
	updatedAt: Date;

	@ApiProperty({
		description: "Full invite URL (computed field)",
		example: "https://yourapp.com/invite/abc123def456ghi789",
		required: false,
	})
	inviteUrl?: string;

	@ApiProperty({
		description: "Whether the link has expired",
		example: false,
	})
	isExpired?: boolean;

	@ApiProperty({
		description: "Whether the link has reached maximum uses",
		example: false,
	})
	isMaxUsed?: boolean;

	@ApiProperty({
		description: "Remaining uses (if maxUses is set)",
		example: 45,
		required: false,
	})
	remainingUses?: number;

	static fromEntity(
		entity: GroupInviteLinkEntity,
		baseUrl?: string,
	): GroupInviteLinkResponse {
		const response = new GroupInviteLinkResponse();

		response.id = entity.id;
		response.groupId = entity.groupId;
		response.createdBy = entity.createdBy;
		response.token = entity.token;
		response.name = entity.name;
		response.description = entity.description;
		response.expiresAt = entity.expiresAt;
		response.maxUses = entity.maxUses;
		response.usedCount = entity.usedCount;
		response.isActive = entity.isActive;
		response.createdAt = entity.createdAt;
		response.updatedAt = entity.updatedAt;

		// Include related entities if loaded
		if (entity.group) {
			response.group = GroupResponse.fromEntity(entity.group);
		}

		if (entity.creator) {
			response.creator = UserResponse.fromEntity(entity.creator);
		}

		// Computed fields
		if (baseUrl) {
			response.inviteUrl = `${baseUrl}/invite/${entity.token}`;
		}

		response.isExpired = entity.expiresAt
			? new Date() > entity.expiresAt
			: false;
		response.isMaxUsed = entity.maxUses
			? entity.usedCount >= entity.maxUses
			: false;
		response.remainingUses = entity.maxUses
			? Math.max(0, entity.maxUses - entity.usedCount)
			: undefined;

		return response;
	}

	static fromEntities(
		entities: GroupInviteLinkEntity[],
		baseUrl?: string,
	): GroupInviteLinkResponse[] {
		return entities.map((entity) => this.fromEntity(entity, baseUrl));
	}
}

export class GroupInviteLinkPublicResponse {
	@ApiProperty({
		description: "Invite link token",
		example: "abc123def456ghi789",
	})
	token: string;

	@ApiProperty({
		description: "Group information",
		type: () => GroupResponse,
	})
	group: GroupResponse;

	@ApiProperty({
		description: "Creator information",
		type: () => UserResponse,
	})
	creator: UserResponse;

	@ApiProperty({
		description: "Optional name/label for the invite link",
		example: "Weekly Team Meeting",
		required: false,
	})
	name?: string;

	@ApiProperty({
		description: "Optional description for the invite link",
		example: "Link for new team members to join our weekly meetings",
		required: false,
	})
	description?: string;

	@ApiProperty({
		description: "Whether the link is still valid",
		example: true,
	})
	isValid: boolean;

	@ApiProperty({
		description: "Reason if the link is invalid",
		example: "Link has expired",
		required: false,
	})
	invalidReason?: string;

	static fromEntity(
		entity: GroupInviteLinkEntity,
	): GroupInviteLinkPublicResponse {
		const response = new GroupInviteLinkPublicResponse();

		response.token = entity.token;
		response.name = entity.name;
		response.description = entity.description;

		// Include related entities
		if (entity.group) {
			response.group = GroupResponse.fromEntity(entity.group);
		}

		if (entity.creator) {
			response.creator = UserResponse.fromEntity(entity.creator);
		}

		// Determine validity
		const now = new Date();
		const isExpired = entity.expiresAt ? now > entity.expiresAt : false;
		const isMaxUsed = entity.maxUses
			? entity.usedCount >= entity.maxUses
			: false;

		response.isValid = entity.isActive && !isExpired && !isMaxUsed;

		if (!response.isValid) {
			if (!entity.isActive) {
				response.invalidReason = "Link has been deactivated";
			} else if (isExpired) {
				response.invalidReason = "Link has expired";
			} else if (isMaxUsed) {
				response.invalidReason = "Link has reached maximum usage limit";
			}
		}

		return response;
	}
}
