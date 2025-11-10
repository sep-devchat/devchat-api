import { GroupInvitationEntity } from "@db/entities/group-invitation.entity";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { GroupInvitationStatus } from "@utils";
import { UserResponse } from "@modules/user/dto";
import { GroupResponse } from "@modules/group/dto";

export class GroupInvitationResponse {
	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "Group invitation ID",
	})
	id: string;

	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "ID of the user who sent the group invitation",
	})
	fromUserId: string;

	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "ID of the user who received the group invitation",
	})
	toUserId: string;

	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "ID of the group for the invitation",
	})
	groupId: string;

	@ApiPropertyOptional({
		example: "Hi! Would you like to join our development team?",
		description: "Optional message sent with the group invitation",
	})
	message?: string;

	@ApiProperty({
		example: GroupInvitationStatus.PENDING,
		description:
			"Group invitation status (0-Pending, 1-Accepted, 2-Declined, 3-Cancelled)",
		enum: GroupInvitationStatus,
	})
	status: GroupInvitationStatus;

	@ApiProperty({
		example: "123e4567-e89b-12d3-a456-426614174000",
		description: "ID of the user who created this group invitation",
	})
	createdBy: string;

	@ApiPropertyOptional({
		type: () => UserResponse,
		description: "User who sent the group invitation",
	})
	fromUser?: UserResponse;

	@ApiPropertyOptional({
		type: () => UserResponse,
		description: "User who received the group invitation",
	})
	toUser?: UserResponse;

	@ApiPropertyOptional({
		type: () => GroupResponse,
		description: "Group for the invitation",
	})
	group?: GroupResponse;

	@ApiProperty({
		example: "2024-01-01T00:00:00.000Z",
		description: "Creation date",
	})
	createdAt: Date;

	@ApiProperty({
		example: "2024-01-01T00:00:00.000Z",
		description: "Last update date",
	})
	updatedAt: Date;

	static fromEntity(entity: GroupInvitationEntity): GroupInvitationResponse {
		return {
			id: entity.id,
			fromUserId: entity.fromUserId,
			toUserId: entity.toUserId,
			groupId: entity.groupId,
			message: entity.message,
			status: entity.status as GroupInvitationStatus,
			createdBy: entity.createdBy,
			fromUser: entity.fromUser
				? UserResponse.fromEntity(entity.fromUser)
				: undefined,
			toUser: entity.toUser
				? UserResponse.fromEntity(entity.toUser)
				: undefined,
			group: entity.group ? GroupResponse.fromEntity(entity.group) : undefined,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}

	static fromEntities(
		entities: GroupInvitationEntity[],
	): GroupInvitationResponse[] {
		return entities.map((entity) => this.fromEntity(entity));
	}
}
