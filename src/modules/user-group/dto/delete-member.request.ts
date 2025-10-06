import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class DeleteMemberRequest {
	@ApiProperty({
		example: "ccc2c770-9fa6-11f0-b97a-4d13d9b105b0",
		description: "User ID",
	})
	@IsUUID()
	userId: string;
}
