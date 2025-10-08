import { ApiProperty } from "@nestjs/swagger";
import { PermissionEntity } from "@db/entities";

export class PermissionResponse {
	@ApiProperty()
	id: string;

	@ApiProperty()
	code: string;

	@ApiProperty()
	name: string;

	@ApiProperty({ required: false, nullable: true })
	description?: string | null;

	@ApiProperty()
	isActive: boolean;

	@ApiProperty()
	createdAt: Date;

	@ApiProperty({ nullable: true })
	updatedAt: Date | null;

	static fromEntity(e: PermissionEntity): PermissionResponse {
		const r = new PermissionResponse();
		r.id = e.id;
		r.code = e.code;
		r.name = e.name;
		r.description = e.description;
		r.isActive = e.isActive;
		r.createdAt = e.createdAt;
		r.updatedAt = e.updatedAt;
		return r;
	}

	static fromEntities(list: PermissionEntity[]) {
		return list.map(this.fromEntity);
	}
}
