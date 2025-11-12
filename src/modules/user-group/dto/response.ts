import { GroupEntity, UserEntity, UserGroupEntity } from "@db/entities";
import { Profile } from "@modules/auth/dto";
import { GroupResponse } from "@modules/group/dto";
import { UserResponse } from "@modules/user/dto";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { InvitationStatus } from "@utils";

export class UserGroupResponse {
	@ApiProperty({ example: "ccc2c770-9fa6-11f0-b97a-4d13d9b105b0" })
	id: string;

	@ApiProperty({ example: "2e7500a0-9fa7-11f0-b97a-4d13d9b105b0" })
	groupId: string;

	@ApiProperty({ example: "3f91cd00-9fa7-11f0-b97a-4d13d9b105b0" })
	userId: string;

	@ApiProperty({ example: "012a3456-b78c-90d1-e234-567890123456" })
	addedById: string;

	@ApiProperty({ example: "2024-01-01T00:00:00.000Z" })
	joinedAt: Date;

	@ApiProperty({ example: "2024-01-01T00:00:00.000Z" })
	invitedAt: Date;

	@ApiProperty({ example: `${InvitationStatus.PENDING}` })
	status: number;

	@ApiProperty()
	group: GroupResponse;

	@ApiProperty()
	user: UserResponse;

	@ApiProperty()
	addedBy: Profile;

	static fromEntity(entity: UserGroupEntity): UserGroupResponse {
		const response = new UserGroupResponse();
		response.id = entity.id;
		response.groupId = entity.group.id;
		response.userId = entity.user.id;
		response.addedById = entity.addedBy.id;
		response.joinedAt = entity.joinedAt;
		response.invitedAt = entity.invitedAt;
		response.group = GroupResponse.fromEntity(entity.group);
		response.user = UserResponse.fromEntity(entity.user);
		response.addedBy = Profile.fromEntity(entity.addedBy);
		return response;
	}

	static fromEntities(entities: UserGroupEntity[]): UserGroupResponse[] {
		return entities.map((entity) => this.fromEntity(entity));
	}
}
