import { ApiProperty } from "@nestjs/swagger";
import { AdminRoleEntity } from "@db/entities";

export class AdminRoleResponse {
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

	@ApiProperty()
	createdAt: Date;

	@ApiProperty()
	updatedAt: Date | null;

	static fromEntity(e: AdminRoleEntity): AdminRoleResponse {
		const r = new AdminRoleResponse();
		r.id = e.id;
		r.role = e.role;
		r.roleName = e.roleName;
		r.permissions = e.permissions;
		r.isActive = e.isActive;
		r.createdAt = e.createdAt;
		r.updatedAt = e.updatedAt;
		return r;
	}

	static fromEntities(list: AdminRoleEntity[]) {
		return list.map(this.fromEntity);
	}
}
