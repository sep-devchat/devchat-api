import { ApiProperty } from "@nestjs/swagger";

export class AssignUserRoleRequest {
	@ApiProperty()
	userId: string;
}
