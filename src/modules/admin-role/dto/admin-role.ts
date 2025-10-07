import { AdminRoleEntity } from "@db/entities";
import { ApiProperty } from "@nestjs/swagger";

export class AdminRoleProfile {
	@ApiProperty()
	id: string;

	@ApiProperty()
	role: string;

	@ApiProperty()
	roleName: string;

	@ApiProperty({ type: [String] })
	permissions: string[];

	@ApiProperty()
	isActive: boolean;

	static fromEntity(entity: AdminRoleEntity): AdminRoleProfile {
		return {
			id: entity.id,
			role: entity.role,
			roleName: entity.roleName,
			permissions: entity.permissions ?? [],
			isActive: entity.isActive,
		};
	}
}
